import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

// Define interface for environment configuration
interface EnvironmentConfig {
  USE_EXISTING_RDS: boolean;
  EXISTING_RDS_IDENTIFIER?: string;
  USE_EXISTING_SECRET: boolean;
  EXISTING_SECRET_ARN?: string;
  USE_EXISTING_VPC: boolean;
  EXISTING_VPC_ID?: string;
  USE_EXISTING_COGNITO: boolean;
  EXISTING_USER_POOL_ID?: string;
  EXISTING_USER_POOL_CLIENT_ID?: string;
  stackName: string;
  lambdaFunctionName: string;
  apiName: string;
  secretName: string;
  calendarApiSecretArn: string;
}

// Extend stack props to include environment config
interface LmsBackendStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environment: string;
}

export class LmsBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LmsBackendStackProps) {
    super(scope, id, props);

    const { environmentConfig: config, environment } = props;

    // Replace with your actual IP address
    const myIpAddress = '0.0.0.0/32'; // TODO: Replace with your actual IP

    // ============================================================================
    // SECURITY CONFIGURATION
    // ============================================================================
    const ALLOW_PUBLIC_DB_ACCESS = true; // Set to true to allow public internet access to database
    const ALLOWED_IP_RANGES = [
      '0.0.0.0/0', // TODO: Allow all IPs (not recommended for production)
    ];

    // Use configuration from props
    const USE_EXISTING_RDS = config.USE_EXISTING_RDS;
    const EXISTING_RDS_IDENTIFIER = config.EXISTING_RDS_IDENTIFIER;
    const USE_EXISTING_SECRET = config.USE_EXISTING_SECRET;
    const EXISTING_SECRET_ARN = config.EXISTING_SECRET_ARN;
    const USE_EXISTING_VPC = config.USE_EXISTING_VPC;
    const EXISTING_VPC_ID = config.EXISTING_VPC_ID;
    const USE_EXISTING_COGNITO = config.USE_EXISTING_COGNITO;
    const EXISTING_USER_POOL_ID = config.EXISTING_USER_POOL_ID;
    const EXISTING_USER_POOL_CLIENT_ID = config.EXISTING_USER_POOL_CLIENT_ID;

    // Environment-specific naming
    const resourceSuffix = environment === 'prod' ? '' : `-${environment}`;

    // ============================================================================
    // VPC Configuration - Only for RDS, Lambda will be outside VPC
    // ============================================================================
    let vpc: ec2.IVpc;

    if (USE_EXISTING_VPC && EXISTING_VPC_ID) {
      vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: EXISTING_VPC_ID,
      });
    } else {
      vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
        isDefault: true,
      });
    }

    // ============================================================================
    // Database Configuration
    // ============================================================================
    let database: rds.IDatabaseInstance;
    let databaseCredentials: secretsmanager.ISecret;
    let existingDbSecurityGroup: ec2.SecurityGroup | undefined;

    if (USE_EXISTING_RDS && EXISTING_RDS_IDENTIFIER) {
      // Use existing RDS instance (for production)
      database = rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'ExistingDatabase', {
        instanceIdentifier: EXISTING_RDS_IDENTIFIER,
        instanceEndpointAddress: 'lms-db-prod.cc7jdytilrfh.af-south-1.rds.amazonaws.com',
        port: 3306,
        securityGroups: [],
      });

      // For existing RDS, create security group to allow access
      existingDbSecurityGroup = new ec2.SecurityGroup(this, `ExistingDatabaseSecurityGroup${resourceSuffix}`, {
        vpc,
        description: `Security group for accessing existing database - ${environment}`,
        allowAllOutbound: false,
      });

      existingDbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(myIpAddress),
        ec2.Port.tcp(3306),
        'Allow my IP to connect to existing MySQL database'
      );

      if (ALLOW_PUBLIC_DB_ACCESS) {
        ALLOWED_IP_RANGES.forEach((ipRange, index) => {
          if (ipRange === '0.0.0.0/0') {
            existingDbSecurityGroup!.addIngressRule(
              ec2.Peer.anyIpv4(),
              ec2.Port.tcp(3306),
              'Allow public internet access to MySQL database (including Lambda)'
            );
          } else {
            existingDbSecurityGroup!.addIngressRule(
              ec2.Peer.ipv4(ipRange),
              ec2.Port.tcp(3306),
              `Allow IP range ${ipRange} to connect to MySQL database`
            );
          }
        });

        existingDbSecurityGroup.addIngressRule(
          ec2.Peer.anyIpv6(),
          ec2.Port.tcp(3306),
          'Allow public IPv6 access to MySQL database'
        );
      }

      // Create/use secret for existing database
      if (USE_EXISTING_SECRET && EXISTING_SECRET_ARN) {
        databaseCredentials = secretsmanager.Secret.fromSecretCompleteArn(this, 'ExistingSecret', EXISTING_SECRET_ARN);
      } else {
        databaseCredentials = new secretsmanager.Secret(this, `ExistingDatabaseCredentials${resourceSuffix}`, {
          secretName: `lms-database-credentials${resourceSuffix}`,
          description: `Credentials for existing LMS database - ${environment}`,
          secretObjectValue: {
            username: cdk.SecretValue.unsafePlainText('admin'),
            password: cdk.SecretValue.unsafePlainText('your-password-here'), // Replace with actual password
            host: cdk.SecretValue.unsafePlainText('lms-db-prod.cc7jdytilrfh.af-south-1.rds.amazonaws.com'),
            port: cdk.SecretValue.unsafePlainText('3306'),
            dbname: cdk.SecretValue.unsafePlainText('lms_db'),
          },
        });
      }

    } else {
      // Create new RDS instance (for development) - Use existing VPC to avoid subnet conflicts
      const databaseSecurityGroup = new ec2.SecurityGroup(this, `DatabaseSecurityGroup${resourceSuffix}`, {
        vpc,
        description: `Security group for RDS database - ${environment}`,
        allowAllOutbound: true,
      });

      // Allow direct IP access for development/management
      databaseSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(myIpAddress),
        ec2.Port.tcp(3306),
        'Allow my IP to connect to MySQL'
      );

      // Allow public access since Lambda is outside VPC and RDS is publicly accessible
      if (ALLOW_PUBLIC_DB_ACCESS) {
        ALLOWED_IP_RANGES.forEach((ipRange, index) => {
          if (ipRange === '0.0.0.0/0') {
            databaseSecurityGroup.addIngressRule(
              ec2.Peer.anyIpv4(),
              ec2.Port.tcp(3306),
              'Allow public internet access to MySQL database'
            );
          } else {
            databaseSecurityGroup.addIngressRule(
              ec2.Peer.ipv4(ipRange),
              ec2.Port.tcp(3306),
              `Allow IP range ${ipRange} to connect to MySQL database`
            );
          }
        });

        databaseSecurityGroup.addIngressRule(
          ec2.Peer.anyIpv6(),
          ec2.Port.tcp(3306),
          'Allow IPv6 access to MySQL'
        );
      }

      databaseCredentials = new secretsmanager.Secret(this, `DatabaseCredentials${resourceSuffix}`, {
        secretName: config.secretName,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\,<>*#%&=_-~`',
          passwordLength: 15,
        },
      });

      database = new rds.DatabaseInstance(this, `LmsDatabase${resourceSuffix}`, {
        instanceIdentifier: `lms-database${resourceSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        credentials: rds.Credentials.fromSecret(databaseCredentials),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroups: [databaseSecurityGroup],
        databaseName: 'lms_database',
        allocatedStorage: 20,
        storageEncrypted: true,
        backupRetention: cdk.Duration.days(environment === 'prod' ? 7 : 1),
        deletionProtection: environment === 'prod',
        removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        publiclyAccessible: true,
      });
    }

    // ============================================================================
    // Cognito Configuration
    // ============================================================================
    let userPool: cognito.IUserPool;
    let userPoolClient: cognito.IUserPoolClient;

    if (USE_EXISTING_COGNITO && EXISTING_USER_POOL_ID && EXISTING_USER_POOL_CLIENT_ID) {
      userPool = cognito.UserPool.fromUserPoolId(this, 'ExistingUserPool', EXISTING_USER_POOL_ID);
      userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(this, 'ExistingUserPoolClient', EXISTING_USER_POOL_CLIENT_ID);
    } else {
      // Create new Cognito User Pool for dev
      userPool = new cognito.UserPool(this, `LmsUserPool${resourceSuffix}`, {
        userPoolName: `lms-user-pool${resourceSuffix}`,
        selfSignUpEnabled: true,
        signInAliases: {
          email: true
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
          givenName: {
            required: true,
            mutable: true,
          },
          familyName: {
            required: true,
            mutable: true,
          },
        },
        customAttributes: {
          role: new cognito.StringAttribute({ mutable: true }),
          occupation: new cognito.StringAttribute({ mutable: true }),
          userId: new cognito.StringAttribute({ mutable: true }),
        },
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      });

      userPoolClient = new cognito.UserPoolClient(this, `LmsUserPoolClient${resourceSuffix}`, {
        userPool,
        userPoolClientName: `lms-web-client${resourceSuffix}`,
        generateSecret: false,
        authFlows: {
          userPassword: true,
          userSrp: true,
          custom: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.PROFILE,
          ],
        },
      });
    }// ============================================================================
    // Policy Document Repository 
    // ============================================================================
    // Create a CloudFront distribution to serve the documents from S3
    const oac = new cloudfront.S3OriginAccessControl(this, 'LmsPolicyDocumentOAC', {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE
    });

    // Create a new S3 bucket that will serve as the document repository
    const policyRepositoryBucket = new s3.Bucket(this, `LmsPolicyDocumentBucket${resourceSuffix}`, {
      bucketName: `lms-policy-documents${resourceSuffix}`
    });

    // CloudFront Distribution
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(policyRepositoryBucket, {
      originAccessControl: oac
    });
    const distribution = new cloudfront.Distribution(this, 'LmsPolicyDocumentDistribution', {
      defaultBehavior: {
        origin: s3Origin
      },
    });

    // Update bucket policy to allow CloudFront to access the bucket
    policyRepositoryBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${policyRepositoryBucket.bucketArn}/*`],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
        }
      }
    }));

    // ============================================================================
    // Lambda Configuration
    // ============================================================================
    const dependenciesLayer = new lambda.LayerVersion(this, `DependenciesLayer${resourceSuffix}`, {
      code: lambda.Code.fromAsset('lambda-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X, lambda.Runtime.NODEJS_22_X],
      description: `Dependencies layer for AWS SDK and MySQL - ${environment}`,
    });

    const lambdaRole = new iam.Role(this, `LambdaExecutionRole${resourceSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [
                databaseCredentials.secretArn,
                config.calendarApiSecretArn
              ],
            }),
          ],
        }),
        EmailAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
              ],
              resources: ['*'],
            }),
          ],
        }),
        CognitoAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:InitiateAuth',
                'cognito-idp:GetUser',
                'cognito-idp:ListUsers',
                'cognito-idp:AdminGetUser',
                'cognito-idp:AdminInitiateAuth',
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminSetUserPassword',
                'cognito-idp:AdminUpdateUserAttributes',
                'cognito-idp:AdminDeleteUser',
              ],
              resources: [userPool.userPoolArn],
            }),
          ],
        }),
        PolicyRepositoryAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:DeleteObject'
              ],
              resources: [`${policyRepositoryBucket.bucketArn}/*`],
            })
          ]
        })
      },
    });

    // Lambda function configuration - Outside VPC for cost optimization and simplicity
    const backendLambda = new NodejsFunction(this, `lms-backend-function${resourceSuffix}`, {
      entry: 'lambda/index.ts',
      handler: 'handler',
      functionName: config.lambdaFunctionName,
      description: `Lambda function for Leave Management System backend - ${environment}`,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
        target: 'es2020',
        nodeModules: [
          'mysql2',
          'jsonwebtoken',
          'zod',
          'dayjs',
        ],
      },
      runtime: lambda.Runtime.NODEJS_22_X,
      role: lambdaRole,
      layers: [dependenciesLayer],
      // No VPC configuration - Lambda runs outside VPC for better performance and lower cost
      environment: {
        COGNITO_CLIENT_ID: USE_EXISTING_COGNITO && EXISTING_USER_POOL_CLIENT_ID ? EXISTING_USER_POOL_CLIENT_ID : userPoolClient.userPoolClientId,
        USER_POOL_ID: USE_EXISTING_COGNITO && EXISTING_USER_POOL_ID ? EXISTING_USER_POOL_ID : userPool.userPoolId,
        DATABASE_SECRET_ARN: databaseCredentials.secretArn,
        GOOGLE_CALENDAR_API_KEY_SECRET_NAME: 'calendar_api',
        SECRET_VALUE_KEY: 'calendarAPI',
        NODE_ENV: environment === 'prod' ? 'production' : 'development',
        ENVIRONMENT: environment,
        SECRET_NAME: config.secretName,
        POLICY_DOCUMENTS_DISTRIBUTION_URL: `https://${distribution.distributionDomainName}`,
        POLICY_DOCUMENTS_BUCKET_NAME: policyRepositoryBucket.bucketName
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      logRetention: environment === 'prod' ? logs.RetentionDays.ONE_WEEK : logs.RetentionDays.THREE_DAYS,
    });

    // ============================================================================
    // API Gateway Configuration
    // ============================================================================
    const api = new apigateway.RestApi(this, `LmsApi${resourceSuffix}`, {
      restApiName: config.apiName,
      description: `API for Leave Management System - ${environment}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: environment === 'prod' ? 'prod' : 'dev',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    const integration = new apigateway.LambdaIntegration(backendLambda, {
      proxy: true,
      allowTestInvoke: true,
    });

    const proxyResource = api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // ============================================================================
    // Outputs
    // ============================================================================
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: `API Gateway URL - ${environment}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: backendLambda.functionName,
      description: `Backend Lambda Function Name - ${environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseCredentials.secretArn,
      description: `Database Credentials Secret ARN - ${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: USE_EXISTING_COGNITO && EXISTING_USER_POOL_ID ? EXISTING_USER_POOL_ID : userPool.userPoolId,
      description: `Cognito User Pool ID - ${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: USE_EXISTING_COGNITO && EXISTING_USER_POOL_CLIENT_ID ? EXISTING_USER_POOL_CLIENT_ID : userPoolClient.userPoolClientId,
      description: `Cognito User Pool Client ID - ${environment}`,
    });

    if (!USE_EXISTING_RDS) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: (database as rds.DatabaseInstance).instanceEndpoint.hostname,
        description: `RDS Database Endpoint - ${environment}`,
      });
    }

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: `VPC ID - ${environment}`,
    });

    if (USE_EXISTING_RDS && existingDbSecurityGroup) {
      new cdk.CfnOutput(this, 'ExistingDatabaseSecurityGroupId', {
        value: existingDbSecurityGroup.securityGroupId,
        description: `Security Group ID for existing database - ${environment}`,
      });
    }

    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Deployment environment',
    });

    new cdk.CfnOutput(this, 'LambdaDeploymentMode', {
      value: 'Outside VPC (Cost Optimized)',
      description: 'Lambda deployment mode - outside VPC for better performance and lower cost',
    });

    new cdk.CfnOutput(this, 'RdsAccessibility', {
      value: USE_EXISTING_RDS ? 'Existing RDS' : 'Public (New)',
      description: 'RDS accessibility mode',
    });

    new cdk.CfnOutput(this, 'Architecture', {
      value: USE_EXISTING_RDS ? 'Production (Existing Infrastructure)' : 'Development (Public RDS + Lambda outside VPC)',
      description: 'Infrastructure architecture pattern',
    });

    new cdk.CfnOutput(this, 'InternetAccess', {
      value: 'Lambda outside VPC with direct internet access',
      description: 'How Lambda accesses internet and public RDS',
    });

    new cdk.CfnOutput(this, 'CostOptimization', {
      value: 'No VPC costs, faster cold starts, direct AWS service access',
      description: 'Benefits of Lambda outside VPC',
    });

    new cdk.CfnOutput(this, 'PolicyDocumentDistributionURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'PolicyDocumentsBucketName', {
      value: policyRepositoryBucket.bucketName,
      description: 'S3 bucket name for policy documents',
    });
  }
}