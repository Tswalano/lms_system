import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LmsBackendStack } from '../lib/lms-backend-stack';

const app = new cdk.App();

// Get environment from context or default to 'prod'
const environment = app.node.tryGetContext('environment') || 'prod';

// Define environment-specific configurations
const envConfigs = {
  prod: {
    // Your existing production configuration
    USE_EXISTING_RDS: true,
    EXISTING_RDS_IDENTIFIER: 'lms-db-staging-cluster',
    USE_EXISTING_SECRET: true,
    EXISTING_SECRET_ARN: 'arn:aws:secretsmanager:af-south-1:143671530412:secret:lmsStaging1-b5f1BX',
    USE_EXISTING_VPC: true,
    EXISTING_VPC_ID: 'vpc-0da5531cdf58244fe',
    USE_EXISTING_COGNITO: true,
    EXISTING_USER_POOL_ID: 'af-south-1_LKNPAJXNY',
    EXISTING_USER_POOL_CLIENT_ID: '4np61q0imo823k3k3l6f60a3av',
    stackName: 'LmsBackendStack',
    lambdaFunctionName: 'LmsBackendFunction',
    apiName: 'LMS Service',
    secretName: 'lmsProduction'
  },
  dev: {
    // Development configuration with new resources
    USE_EXISTING_RDS: false,          // Create new RDS for dev
    USE_EXISTING_SECRET: false,       // Create new secret for dev
    USE_EXISTING_VPC: true,          // Create new VPC for dev (or use existing if preferred)
    USE_EXISTING_COGNITO: false,      // Create new Cognito for dev (or use existing if preferred)
    stackName: 'LmsBackendStack-Dev',
    lambdaFunctionName: 'LmsBackendFunction-Dev',
    apiName: 'LMS Service Dev',
    secretName: 'lmsDevelopment'
  }
};

const config = envConfigs[environment as keyof typeof envConfigs];

if (!config) {
  throw new Error(`Unknown environment: ${environment}. Supported environments: ${Object.keys(envConfigs).join(', ')}`);
}

// Create stack with environment-specific configuration
new LmsBackendStack(app, config.stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.CDK_DEPLOY_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.CDK_DEPLOY_REGION,
  },
  // Pass environment-specific config as props
  environmentConfig: config,
  environment: environment,
});

// Add tags to distinguish environments
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Project', 'LMS');