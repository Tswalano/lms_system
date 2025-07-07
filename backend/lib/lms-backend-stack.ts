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

export class LmsBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Replace with your actual IP address
    const myIpAddress = '0.0.0.0/32'; // TODO: Replace with your actual IP

    // ============================================================================
    // SECURITY CONFIGURATION
    // ============================================================================
    const ALLOW_PUBLIC_DB_ACCESS = true; // Set to true to allow public internet access to database
    const ALLOWED_IP_RANGES = [
      '0.0.0.0/0', // Allow all IPs (not recommended for production)
      // '203.0.113.0/24', // Example: Allow specific IP range
      // '198.51.100.0/24', // Example: Allow another specific IP range
    ];

    // ============================================================================
    // OPTION 1: Use existing RDS instance by identifier
    // ============================================================================
    const USE_EXISTING_RDS = true; // Set to true to use existing RDS
    const EXISTING_RDS_IDENTIFIER = 'lms-db-staging-cluster'; // Replace with your RDS identifier

    // ============================================================================
    // OPTION 2: Use existing database credentials secret
    // ============================================================================
    const USE_EXISTING_SECRET = true; // Set to true to use existing secret
    const EXISTING_SECRET_ARN = 'arn:aws:secretsmanager:af-south-1:143671530412:secret:lmsStaging1-b5f1BX'

    // ============================================================================
    // OPTION 3: Use existing VPC
    // ============================================================================
    const USE_EXISTING_VPC = true; // Set to true to use existing VPC
    const EXISTING_VPC_ID = 'vpc-0da5531cdf58244fe'; // Replace with your VPC ID

    // ============================================================================
    // SUBNET CONFIGURATION FOR EXISTING VPC
    // ============================================================================
    // Since your existing VPC only has public subnets, we'll use PUBLIC for everything
    // This is the fix for the "no Private subnet groups" error
    let LAMBDA_SUBNET_TYPE: ec2.SubnetType;
    let VPC_ENDPOINT_SUBNET_TYPE: ec2.SubnetType;

    if (USE_EXISTING_VPC) {
      // Use PUBLIC subnets since that's what your existing VPC has
      LAMBDA_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
      VPC_ENDPOINT_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
    } else {
      // For new VPC, use the original design
      LAMBDA_SUBNET_TYPE = ec2.SubnetType.PUBLIC;
      VPC_ENDPOINT_SUBNET_TYPE = ec2.SubnetType.PRIVATE_ISOLATED;
    }

    // ============================================================================
    // OPTION 4: Use existing Cognito User Pool
    // ============================================================================
    const USE_EXISTING_COGNITO = true; // Set to true to use existing Cognito
    const EXISTING_USER_POOL_ID = 'af-south-1_LKNPAJXNY'; // Replace with your User Pool ID
    const EXISTING_USER_POOL_CLIENT_ID = '4np61q0imo823k3k3l6f60a3av'; // Replace with your User Pool Client ID

    // VPC Configuration
    let vpc: ec2.IVpc;

    if (USE_EXISTING_VPC) {
      // Use existing VPC
      vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: EXISTING_VPC_ID,
      });
    } else {
      // Create new VPC
      vpc = new ec2.Vpc(this, 'LmsVpc', {
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
    const vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, 'VpcEndpointSecurityGroup', {
      vpc,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: false,
    });

    vpcEndpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // VPC Endpoints - Only create if not using existing VPC with public subnets
    // VPC Endpoints are typically not needed when using public subnets
    let secretsManagerVpcEndpoint: ec2.InterfaceVpcEndpoint | undefined;

    if (!USE_EXISTING_VPC || VPC_ENDPOINT_SUBNET_TYPE !== ec2.SubnetType.PUBLIC) {
      secretsManagerVpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerVpcEndpoint', {
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

    // Database Configuration
    let database: rds.IDatabaseInstance;
    let databaseCredentials: secretsmanager.ISecret;
    let existingDbSecurityGroup: ec2.SecurityGroup | undefined;

    if (USE_EXISTING_RDS) {
      // ============================================================================
      // OPTION 1: Use existing RDS instance
      // ============================================================================
      database = rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'ExistingDatabase', {
        instanceIdentifier: EXISTING_RDS_IDENTIFIER,
        instanceEndpointAddress: 'lms-db-staging-instance.cc7jdytilrfh.af-south-1.rds.amazonaws.com', // Replace with actual endpoint
        port: 3306,
        securityGroups: [], // Will be handled separately
      });

      if (USE_EXISTING_SECRET) {
        // Use existing secret
        databaseCredentials = secretsmanager.Secret.fromSecretCompleteArn(this, 'ExistingSecret', EXISTING_SECRET_ARN);
      } else {
        // Create new secret for existing database
        databaseCredentials = new secretsmanager.Secret(this, 'ExistingDatabaseCredentials', {
          secretName: 'existing-lms-database-credentials',
          description: 'Credentials for existing LMS database',
          secretObjectValue: {
            username: cdk.SecretValue.unsafePlainText('your-db-username'), // Replace with actual username
            password: cdk.SecretValue.unsafePlainText('your-db-password'), // Replace with actual password
            host: cdk.SecretValue.unsafePlainText('your-db-endpoint.region.rds.amazonaws.com'), // Replace with actual endpoint
            port: cdk.SecretValue.unsafePlainText('3306'),
            dbname: cdk.SecretValue.unsafePlainText('your-database-name'), // Replace with actual database name
          },
        });
      }

      // ============================================================================
      // IMPORTANT: MANUAL STEPS REQUIRED TO MAKE DATABASE PUBLICLY ACCESSIBLE
      // ============================================================================
      // After deploying this stack, you MUST manually perform these steps in AWS Console:
      // 
      // 1. Go to RDS Console -> Databases -> Select your database instance
      // 2. Click "Modify"
      // 3. Under "Connectivity":
      //    - Set "Public access" to "Yes"
      //    - Under "VPC security groups", add the security group created by this stack
      //      (Look for "ExistingDatabaseSecurityGroup" in the outputs or EC2 console)
      // 4. Under "Database options":
      //    - Set "Database port" to 3306 (if not already set)
      // 5. Click "Continue" -> "Modify DB instance"
      // 6. The modification will take a few minutes to apply
      // 
      // Alternative CLI command (replace with your actual values):
      // aws rds modify-db-instance \
      //   --db-instance-identifier lms-db-staging-cluster \
      //   --publicly-accessible \
      //   --vpc-security-group-ids sg-xxxxxxxxx \
      //   --apply-immediately
      // ============================================================================

      // Create security group for existing database access (publicly accessible)
      existingDbSecurityGroup = new ec2.SecurityGroup(this, 'ExistingDatabaseSecurityGroup', {
        vpc,
        description: 'Security group for accessing existing database (public access)',
        allowAllOutbound: false,
      });

      // Allow Lambda to connect from public subnets
      existingDbSecurityGroup.addIngressRule(
        lambdaSecurityGroup,
        ec2.Port.tcp(3306),
        'Allow Lambda to connect to existing MySQL database'
      );

      // Allow your specific IP to connect
      existingDbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(myIpAddress),
        ec2.Port.tcp(3306),
        'Allow my IP to connect to existing MySQL database'
      );

      // Configure public access based on security settings
      if (ALLOW_PUBLIC_DB_ACCESS) {
        // Add rules for each allowed IP range
        ALLOWED_IP_RANGES.forEach((ipRange, index) => {
          if (ipRange === '0.0.0.0/0') {
            // Allow all IPv4 addresses
            existingDbSecurityGroup!.addIngressRule(
              ec2.Peer.anyIpv4(),
              ec2.Port.tcp(3306),
              'Allow public internet access to MySQL database'
            );
          } else {
            // Allow specific IP range
            existingDbSecurityGroup!.addIngressRule(
              ec2.Peer.ipv4(ipRange),
              ec2.Port.tcp(3306),
              `Allow IP range ${ipRange} to connect to MySQL database`
            );
          }
        });

        // Optionally allow IPv6 (uncomment if needed)
        existingDbSecurityGroup.addIngressRule(
          ec2.Peer.anyIpv6(),
          ec2.Port.tcp(3306),
          'Allow public IPv6 access to MySQL database'
        );
      }

    } else {
      // ============================================================================
      // OPTION 2: Create new RDS instance (original code)
      // ============================================================================
      const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
        vpc,
        description: 'Security group for RDS database',
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

      databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
        secretName: 'lmsProduction',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      });

      // Use PUBLIC subnets for new database if existing VPC only has public subnets
      const dbSubnetType = USE_EXISTING_VPC ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_ISOLATED;

      database = new rds.DatabaseInstance(this, 'LmsDatabase', {
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
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        // If using public subnets, make database publicly accessible
        publiclyAccessible: USE_EXISTING_VPC,
      });
    }

    // ============================================================================
    // OPTION 3: Use external database (outside AWS)
    // ============================================================================
    const USE_EXTERNAL_DB = false; // Set to true to use external database

    if (USE_EXTERNAL_DB) {
      const databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
        secretName: 'lmsProductionCredentials',
        description: 'Credentials for LMS production database',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin', dbname: 'lms_db', host: 'external-db-host.com', port: '3306' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      });
    }

    // ============================================================================
    // Cognito Configuration - Use existing or create new
    // ============================================================================
    let userPool: cognito.IUserPool;
    let userPoolClient: cognito.IUserPoolClient;

    if (USE_EXISTING_COGNITO) {
      // Use existing Cognito User Pool
      userPool = cognito.UserPool.fromUserPoolId(this, 'ExistingUserPool', EXISTING_USER_POOL_ID);
      userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(this, 'ExistingUserPoolClient', EXISTING_USER_POOL_CLIENT_ID);
    } else {
      // Create new Cognito User Pool (original code)
      userPool = new cognito.UserPool(this, 'LmsUserPool', {
        userPoolName: 'lms-user-pool',
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

      userPoolClient = new cognito.UserPoolClient(this, 'LmsUserPoolClient', {
        userPool,
        userPoolClientName: 'lms-web-client',
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

    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      code: lambda.Code.fromAsset('lambda-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X, lambda.Runtime.NODEJS_22_X],
      description: 'Dependencies layer for AWS SDK and MySQL',
    });

    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
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
        // SES ses:SendEmail permissions
        EmailAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
              ],
              resources: ['*'], //TODO: SES permissions can be broad, adjust as needed
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
                'cognito-idp:AdminCreateUser',           // Add this permission
                'cognito-idp:AdminSetUserPassword',      // Often needed with AdminCreateUser
                'cognito-idp:AdminUpdateUserAttributes', // Often needed for user management
                'cognito-idp:AdminDeleteUser',           // Optional: if you need to delete users
              ],
              resources: [userPool.userPoolArn],
            }),
          ],
        }),
      },
    });

    const backendLambda = new NodejsFunction(this, 'lms-backend-function', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      functionName: 'LmsBackendFunction',
      description: 'Lambda function for Leave Management System backend',
      bundling: {
        externalModules: ['aws-sdk'], // Exclude AWS SDK from bundling
        minify: true,
        sourceMap: true,
        target: 'es2020', // Use a modern JavaScript version
        nodeModules: [
          'mysql2',
          'jsonwebtoken',
          'zod',
          'dayjs',
        ],
      },
      runtime: lambda.Runtime.NODEJS_22_X,
      role: lambdaRole,
      // Remove VPC configuration if database is publicly accessible
      // vpc,
      // vpcSubnets: {
      //   subnetType: LAMBDA_SUBNET_TYPE,
      // },
      // securityGroups: [lambdaSecurityGroup],
      layers: [dependenciesLayer],
      environment: {
        COGNITO_CLIENT_ID: USE_EXISTING_COGNITO ? EXISTING_USER_POOL_CLIENT_ID : userPoolClient.userPoolClientId,
        USER_POOL_ID: USE_EXISTING_COGNITO ? EXISTING_USER_POOL_ID : userPool.userPoolId,
        DATABASE_SECRET_ARN: databaseCredentials.secretArn,

        GOOGLE_CALENDAR_API_KEY_SECRET_NAME: 'calendar_api', // TODO : Replace with your actual secret name
        SECRET_VALUE_KEY: 'calendarAPI', // TODO : Replace with your actual secret key name

        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Only add dependency if VPC endpoint was created
    if (secretsManagerVpcEndpoint) {
      backendLambda.node.addDependency(secretsManagerVpcEndpoint);
    }

    const api = new apigateway.RestApi(this, 'LmsApi', {
      restApiName: 'LMS Service',
      description: 'API for Leave Management System',
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
        stageName: 'prod',
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

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: backendLambda.functionName,
      description: 'Backend Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseCredentials.secretArn,
      description: 'Database Credentials Secret ARN',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: USE_EXISTING_COGNITO ? EXISTING_USER_POOL_ID : userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: USE_EXISTING_COGNITO ? EXISTING_USER_POOL_CLIENT_ID : userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    if (!USE_EXISTING_RDS && !USE_EXTERNAL_DB) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: (database as rds.DatabaseInstance).instanceEndpoint.hostname,
        description: 'RDS Database Endpoint',
      });
    }

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    // Output the security group ID for the existing database (if using existing RDS)
    if (USE_EXISTING_RDS && existingDbSecurityGroup) {
      new cdk.CfnOutput(this, 'ExistingDatabaseSecurityGroupId', {
        value: existingDbSecurityGroup.securityGroupId,
        description: 'Security Group ID for existing database - attach this to your RDS instance',
      });
    }

    // Output information about subnet configuration
    new cdk.CfnOutput(this, 'SubnetConfiguration', {
      value: `Lambda: ${LAMBDA_SUBNET_TYPE}, VPC Endpoints: ${VPC_ENDPOINT_SUBNET_TYPE}`,
      description: 'Subnet types used for Lambda and VPC endpoints',
    });
  }
}