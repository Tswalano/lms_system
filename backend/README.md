# LMS Backend CDK TypeScript Project

This is a CDK project for the Leave Management System (LMS) backend infrastructure, built with TypeScript and supporting multiple deployment environments.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Project Structure

```
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definitions
├── lambda/                 # Lambda function source code
├── lambda-layer/           # Lambda layer dependencies
├── test/                   # Unit tests
└── README.md              # This file
```

## Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bootstrap CDK (if not done before):
   ```bash
   cdk bootstrap
   ```

## Multi-Environment CDK Deployment Guide

This project supports multiple deployment environments (production and development) with environment-specific configurations.

### Deployment Commands

#### Deploy Production Environment (Existing Infrastructure)
```bash
# Deploy to production (uses existing resources)
cdk deploy -c environment=prod

# Or since prod is the default:
cdk deploy
```

#### Deploy Development Environment (New Infrastructure)
```bash
# Deploy to development (creates new resources)
cdk deploy -c environment=dev
```

### Standard CDK Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

### Environment-Specific Commands

```bash
# List all stacks for specific environment
cdk list -c environment=dev
cdk list -c environment=prod

# Synthesize CloudFormation templates
cdk synth -c environment=dev
cdk synth -c environment=prod

# Compare deployed stack with current state
cdk diff -c environment=dev
cdk diff -c environment=prod

# Destroy development environment (when no longer needed)
cdk destroy -c environment=dev
```

## Environment Configuration

### Production Environment (`environment=prod`)
- **Stack Name**: `LmsBackendStack`
- **Uses**: Existing RDS, VPC, Cognito, and Secrets Manager resources
- **Lambda Function**: `LmsBackendFunction`
- **API Gateway**: `LMS Service`
- **Database**: Uses existing RDS instance (`lms-db-staging-cluster`)
- **VPC**: Uses existing VPC (`vpc-0da5531cdf58244fe`)
- **Cognito**: Uses existing User Pool (`af-south-1_LKNPAJXNY`)
- **Behavior**: No changes to existing infrastructure

### Development Environment (`environment=dev`)
- **Stack Name**: `LmsBackendStack-Dev`
- **Creates**: New RDS instance, new VPC (optional), new Cognito User Pool
- **Lambda Function**: `LmsBackendFunction-Dev`
- **API Gateway**: `LMS Service Dev`
- **Database**: New MySQL RDS instance with T3.micro (cost-optimized)
- **Isolation**: Completely separate from production resources
- **Cost Optimization**: 
  - 1-day backup retention (vs 7 days in prod)
  - 3-day log retention (vs 7 days in prod)
  - No deletion protection (vs protected in prod)

## Resource Naming Convention

All development resources receive environment-specific suffixes to avoid conflicts:

| Resource Type | Production | Development |
|---------------|------------|-------------|
| Lambda Function | `LmsBackendFunction` | `LmsBackendFunction-Dev` |
| API Gateway | `LMS Service` | `LMS Service Dev` |
| RDS Instance | `lms-db-staging-cluster` (existing) | `LmsDatabase-Dev` |
| Security Groups | Various existing | `*SecurityGroup-Dev` |
| Secrets | `lmsStaging1` (existing) | `lmsDevelopment` |
| User Pool | `af-south-1_LKNPAJXNY` (existing) | `lms-user-pool-dev` |

## Key Features

### Environment Isolation
- **Zero Impact on Production**: Dev deployments don't affect existing prod infrastructure
- **Full Feature Parity**: Dev environment mirrors prod functionality
- **Independent Scaling**: Each environment can be scaled independently

### Infrastructure Components
- **API Gateway**: RESTful API with CORS support
- **Lambda**: Node.js 22.x runtime with VPC connectivity
- **RDS MySQL**: Database with automated backups and encryption
- **Cognito**: User authentication and authorization
- **Secrets Manager**: Secure credential storage
- **VPC**: Network isolation and security groups

### Security Features
- **IAM Roles**: Least-privilege access for Lambda functions
- **Security Groups**: Network-level access control
- **Secrets Manager**: Encrypted credential storage
- **VPC Endpoints**: Private communication with AWS services

## Environment Variables

The Lambda function receives environment-specific variables:

| Variable | Production | Development |
|----------|------------|-------------|
| `ENVIRONMENT` | `prod` | `dev` |
| `NODE_ENV` | `production` | `development` |
| `COGNITO_CLIENT_ID` | Existing client ID | New client ID |
| `USER_POOL_ID` | Existing pool ID | New pool ID |
| `DATABASE_SECRET_ARN` | Existing secret ARN | New secret ARN |

## Deployment Workflow

### For Development
1. Make changes to your code
2. Deploy to dev environment: `cdk deploy -c environment=dev`
3. Test your changes using the dev API Gateway URL
4. Iterate and refine

### For Production
1. Ensure changes work correctly in dev environment
2. Deploy to production: `cdk deploy -c environment=prod`
3. Monitor CloudWatch logs and metrics

## Cost Optimization

Development environment is optimized for cost:
- **T3.micro** RDS instances
- **Shorter retention periods** for logs and backups
- **No deletion protection** for easy cleanup
- **Minimal backup retention**

## Monitoring and Observability

- **CloudWatch Logs**: Automatic log collection from Lambda
- **CloudWatch Metrics**: API Gateway and Lambda metrics
- **X-Ray Tracing**: Distributed tracing (can be enabled)
- **VPC Flow Logs**: Network traffic monitoring (optional)

## Cleanup

To remove the development environment:
```bash
cdk destroy -c environment=dev
```

⚠️ **Warning**: Never run destroy on production without careful consideration:
```bash
# Only run this if you're absolutely sure!
cdk destroy -c environment=prod
```

## Troubleshooting

### Common Issues

1. **VPC Subnet Errors**: Ensure your VPC has the required subnet types
2. **Database Connectivity**: Check security group rules and VPC configuration
3. **Lambda Timeout**: Increase timeout if needed for database operations
4. **Secrets Access**: Verify IAM permissions for Secrets Manager

### Useful Commands for Debugging

```bash
# View detailed stack information
cdk metadata -c environment=dev

# Check for policy validation errors
cdk doctor

# View synthesized template
cdk synth -c environment=dev > template.yaml
```

## Contributing

1. Make changes in a feature branch
2. Test in development environment
3. Submit pull request with deployment evidence
4. Deploy to production after approval

## Support

For issues and questions:
- Check CloudWatch logs for Lambda errors
- Review API Gateway logs for request issues  
- Use AWS Console to inspect resource configurations