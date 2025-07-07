# LMS Application (Leave Management System)

## Project Overview

A full-stack application for managing employee leave requests with:
- **Frontend**: React.js single-page application
- **Backend**: AWS serverless infrastructure deployed with CDK (TypeScript)
- **CI/CD**: Automated deployment via GitHub Actions

## Project Structure

```
lms-application/
├── frontend/          # React frontend application
├── backend/           # CDK backend infrastructure
└── .github/workflows/ # CI/CD deployment pipelines
```

## Frontend (React Application)

### Features
- User authentication and authorization
- Leave request submission and approval workflows
- Team availability calendar
- Responsive design

### Development Setup

1. **Prerequisites**
   - Node.js 18.x
   - npm 9.x+

2. **Installation**
   ```bash
   cd frontend
   npm install
   ```

3. **Running Locally**
   ```bash
   npm start
   ```
   Runs on: http://localhost:3000

4. **Environment Variables**
   Create `.env` file with:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_AWS_REGION=us-east-1
   ```

## Backend (AWS CDK Infrastructure)

### Features
- API Gateway REST API
- Lambda function handlers
- DynamoDB database
- Cognito authentication
- SES email notifications

### Development Setup

1. **Prerequisites**
   - AWS CLI configured
   - AWS CDK v2.x
   - Node.js 18.x

2. **Installation**
   ```bash
   cd backend
   npm install
   ```

3. **Deployment**
   ```bash
   # Bootstrap CDK (first time only)
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION

   # Deploy to AWS
   cdk deploy
   ```

4. **Environment Variables**
   Create `.env` file with:
   ```env
   AWS_ACCOUNT_ID=1234567890
   AWS_REGION=us-east-1
   TABLE_NAME=LMS-Table
   ```

## Deployment Pipeline

### GitHub Actions Workflow

Automatically deploys on push to `main` branch:
1. Frontend deploys to S3 bucket
2. Backend deploys CDK stack with:
   - Lambda functions
   - API Gateway
   - Database resources

### Required Secrets
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCOUNT_ID`

## Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test
```

## Troubleshooting

**Lambda Template Error**
If seeing `ENOENT` for template files:
1. Verify `index.html` exists in `frontend/public/`
2. Check GitHub Actions logs for template copy step

## Contributing

1. Create feature branch from `main`
2. Submit PR with description of changes
3. Include relevant tests

## License

MIT License