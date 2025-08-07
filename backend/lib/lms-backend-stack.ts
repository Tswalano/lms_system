import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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
      '0.0.0.0/0', // Allow all IPs (not recommended for production)
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
    // SUBNET CONFIGURATION
    // ============================================================================
    let LAMBDA_SUBNET_TYPE: ec2.SubnetType;
    let VPC_ENDPOINT_SUBNET_TYPE: ec2.SubnetType;

    if (USE_EXISTING_VPC) {
      LAMBDA_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
      VPC_ENDPOINT_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
    } else {
      LAMBDA_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
      VPC_ENDPOINT_SUBNET_TYPE = ec2.SubnetType.PRIVATE_ISOLATED;
    }

    // ============================================================================
    // VPC Configuration
    // ============================================================================
    let vpc: ec2.IVpc;

    if (USE_EXISTING_VPC && EXISTING_VPC_ID) {
      // Use existing VPC
      vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: EXISTING_VPC_ID,
      });
    } else {
      // Create new VPC for dev environment
      vpc = new ec2.Vpc(this, `LmsVpc${resourceSuffix}`, {
        maxAzs: 2,
        natGateways: 0,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          {
            cidrMask: 24,
            name: 'database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
    }

    // Security Group for VPC Endpoints
    const vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, `VpcEndpointSecurityGroup${resourceSuffix}`, {
      vpc,
      description: `Security group for VPC endpoints - ${environment}`,
      allowAllOutbound: false,
    });

    vpcEndpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, `LambdaSecurityGroup${resourceSuffix}`, {
      vpc,
      description: `Security group for Lambda functions - ${environment}`,
      allowAllOutbound: true,
    });

    // VPC Endpoints
    let secretsManagerVpcEndpoint: ec2.InterfaceVpcEndpoint | undefined;

    if (!USE_EXISTING_VPC || VPC_ENDPOINT_SUBNET_TYPE !== ec2.SubnetType.PUBLIC) {
      secretsManagerVpcEndpoint = new ec2.InterfaceVpcEndpoint(this, `SecretsManagerVpcEndpoint${resourceSuffix}`, {
        vpc,
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: {
          subnetType: VPC_ENDPOINT_SUBNET_TYPE,
        },
        securityGroups: [vpcEndpointSecurityGroup],
        privateDnsEnabled: true,
        open: true,
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
        instanceEndpointAddress: 'lms-db-staging-instance.cc7jdytilrfh.af-south-1.rds.amazonaws.com',
        port: 3306,
        securityGroups: [],
      });

      if (USE_EXISTING_SECRET && EXISTING_SECRET_ARN) {
        databaseCredentials = secretsmanager.Secret.fromSecretCompleteArn(this, 'ExistingSecret', EXISTING_SECRET_ARN);
      } else {
        databaseCredentials = new secretsmanager.Secret(this, `ExistingDatabaseCredentials${resourceSuffix}`, {
          secretName: `existing-lms-database-credentials${resourceSuffix}`,
          description: `Credentials for existing LMS database - ${environment}`,
          secretObjectValue: {
            username: cdk.SecretValue.unsafePlainText('your-db-username'),
            password: cdk.SecretValue.unsafePlainText('your-db-password'),
            host: cdk.SecretValue.unsafePlainText('your-db-endpoint.region.rds.amazonaws.com'),
            port: cdk.SecretValue.unsafePlainText('3306'),
            dbname: cdk.SecretValue.unsafePlainText('your-database-name'),
          },
        });
      }

      existingDbSecurityGroup = new ec2.SecurityGroup(this, `ExistingDatabaseSecurityGroup${resourceSuffix}`, {
        vpc,
        description: `Security group for accessing existing database - ${environment}`,
        allowAllOutbound: false,
      });

      existingDbSecurityGroup.addIngressRule(
        lambdaSecurityGroup,
        ec2.Port.tcp(3306),
        'Allow Lambda to connect to existing MySQL database'
      );

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
              'Allow public internet access to MySQL database'
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

    } else {
      // Create new RDS instance (for development)
      const databaseSecurityGroup = new ec2.SecurityGroup(this, `DatabaseSecurityGroup${resourceSuffix}`, {
        vpc,
        description: `Security group for RDS database - ${environment}`,
        allowAllOutbound: false,
      });

      databaseSecurityGroup.addIngressRule(
        lambdaSecurityGroup,
        ec2.Port.tcp(3306),
        'Allow Lambda to connect to MySQL'
      );

      databaseSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(myIpAddress),
        ec2.Port.tcp(3306),
        'Allow my IP to connect to MySQL'
      );

      databaseCredentials = new secretsmanager.Secret(this, `DatabaseCredentials${resourceSuffix}`, {
        secretName: config.secretName,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      });

      const dbSubnetType = USE_EXISTING_VPC ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_ISOLATED;

      database = new rds.DatabaseInstance(this, `LmsDatabase${resourceSuffix}`, {
        instanceIdentifier: `lms-db-${resourceSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        credentials: rds.Credentials.fromSecret(databaseCredentials),
        vpc,
        vpcSubnets: {
          subnetType: dbSubnetType,
        },
        securityGroups: [databaseSecurityGroup],
        databaseName: 'lms_db',
        allocatedStorage: 20,
        storageEncrypted: true,
        backupRetention: cdk.Duration.days(environment === 'prod' ? 7 : 1), // Shorter backup for dev
        deletionProtection: environment === 'prod', // Only protect production
        removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        publiclyAccessible: USE_EXISTING_VPC,
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
          email: true,
          username: true,
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
    }

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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
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
              resources: [databaseCredentials.secretArn, "*"],
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
      },
    });

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
      environment: {
        COGNITO_CLIENT_ID: USE_EXISTING_COGNITO && EXISTING_USER_POOL_CLIENT_ID ? EXISTING_USER_POOL_CLIENT_ID : userPoolClient.userPoolClientId,
        USER_POOL_ID: USE_EXISTING_COGNITO && EXISTING_USER_POOL_ID ? EXISTING_USER_POOL_ID : userPool.userPoolId,
        DATABASE_SECRET_ARN: databaseCredentials.secretArn,
        GOOGLE_CALENDAR_API_KEY_SECRET_NAME: 'calendar_api',
        SECRET_VALUE_KEY: 'calendarAPI',
        NODE_ENV: environment === 'prod' ? 'production' : 'development',
        ENVIRONMENT: environment,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      logRetention: environment === 'prod' ? logs.RetentionDays.ONE_WEEK : logs.RetentionDays.THREE_DAYS,
    });

    if (secretsManagerVpcEndpoint) {
      backendLambda.node.addDependency(secretsManagerVpcEndpoint);
    }

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
  }
}