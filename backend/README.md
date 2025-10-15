# LMS Backend – Deployment Guide

This document explains how to **build**, **deploy**, and **destroy** the LMS backend infrastructure using the **GitHub Actions CI/CD pipeline** defined in `.github/workflows/lms-deploy.yml`.

---



## Overview

The LMS system consists of two main components:

* **Frontend** (React/Vite app deployed to AWS S3 + CloudFront)
* **Backend** (Node.js + AWS CDK stack deployed to AWS)

This README focuses **only on the backend** deployment process, managed by **AWS CDK** through GitHub Actions.

---

## Deployment Environments

The pipeline supports two environments:

| Environment | Description                                              |
| ----------- | -------------------------------------------------------- |
| **staging** | Used for testing new features before production release. |
| **prod**    | Production environment with live infrastructure.         |

---

## Prerequisites

Before running any deployment, ensure the following are correctly configured in your repository **secrets** under **Settings → Secrets and Variables → Actions**:

| Secret Name                  | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`          | Access key for AWS IAM user with CDK permissions        |
| `AWS_SECRET_ACCESS_KEY`      | Secret access key for the IAM user                      |
| `AWS_REGION`                 | Target AWS region (e.g. `af-south-1`)                   |
| `AWS_ACCOUNT_ID`             | AWS Account ID used for CDK bootstrapping               |
| `AWS_S3_BUCKET`              | (Optional) Used for frontend artifact storage if shared |
| `CLOUDFRONT_DISTRIBUTION_ID` | (Optional) Used only by frontend deploy step            |
| `GH_TOKEN`                   | GitHub personal access token for release automation     |

---

## Backend Structure

```
backend/
 ├── bin/
 │   └── lms-backend.ts          # CDK app entry point
 ├── lib/
 │   └── lms-backend-stack.ts    # AWS CDK stack definition
 ├── src/
 │   ├── app/                    # Express/Fastify/NestJS application code
 │   ├── lambda/                 # Lambda handlers (if any)
 │   └── ...
 ├── package.json
 ├── tsconfig.json
 └── cdk.json
```

---

## Deployment Methods

### Option 1: Automatic Deployment (on push)

The workflow automatically deploys the backend if:

* Changes are detected inside the `/backend` directory on the `main` branch.
* A **release** is published.

No manual action required — GitHub Actions will:

1. Build the backend (`npm ci` → `npm run build`)
2. Bootstrap CDK if needed
3. Deploy via `npx cdk deploy --require-approval never --context env=prod`

---

### Option 2: Manual Deployment

You can trigger a **manual deploy** from the **GitHub Actions tab**.

1. Go to **Actions → LMS Release and Deployment**
2. Click **Run workflow**
3. Select:

   * **Environment:** `staging` or `prod`
   * **Action:** `deploy`
4. Click **Run workflow**

The workflow will:

* Checkout the backend
* Install dependencies
* Bootstrap the AWS environment
* Deploy CDK stacks using context for the selected environment

---

### Option 3: Destroy Environment

To tear down infrastructure (use carefully):

1. Go to **Actions → LMS Release and Deployment**
2. Click **Run workflow**
3. Select:

   * **Environment:** `staging` or `prod`
   * **Action:** `destroy`
4. Click **Run workflow**

This executes:

```bash
npx cdk destroy --force --context env=<environment>
```

**Warning:** This action deletes all deployed backend resources (Lambdas, API Gateway, Databases, etc.) in the selected environment.

---

## Build Commands

When run locally (for testing):

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm ci

# Build the CDK + backend
npm run build

# (Optional) Bootstrap environment before first deploy
npx cdk bootstrap

# Deploy manually to AWS
npx cdk deploy --require-approval never --context env=staging
```

---

## Useful CDK Commands

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npx cdk synth`   | Synthesizes the CloudFormation template |
| `npx cdk diff`    | Shows what will change before deploying |
| `npx cdk destroy` | Destroys deployed stacks                |
| `npx cdk ls`      | Lists available stacks                  |

---

## Workflow Summary

| Job                  | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| **detect-changes**   | Determines if frontend or backend code changed |
| **semantic-release** | Handles automatic versioning (frontend only)   |
| **frontend-deploy**  | Deploys frontend to S3/CloudFront              |
| **backend**          | Deploys backend CDK stack to AWS               |
| **backend-destroy**  | Removes backend stack from AWS                 |

---

## Example Outputs

After a successful backend deployment, you’ll see logs similar to:

```
✅  Deployment complete: lms-backend-prod
Outputs:
lms-backend.apiUrl = https://abcd1234.execute-api.af-south-1.amazonaws.com/prod/
lms-backend.lambdaArn = arn:aws:lambda:af-south-1:123456789012:function:lms-backend-prod
```

Use these outputs to update your frontend `.env` or Superset connection if needed.

---

## Troubleshooting

| Issue                 | Possible Cause                                  | Solution                                                        |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `cdk bootstrap` fails | Missing IAM permissions                         | Ensure IAM user has `AdministratorAccess` or CDK-specific roles |
| No changes deployed   | `detect-changes` did not detect `backend/` diff | Confirm commit path and branch                                  |
| Deployment stuck      | CloudFormation stack in `ROLLBACK`              | Check AWS Console → CloudFormation Events for details           |
| Destroy fails         | Dependent resources still exist                 | Manually remove resources or use `--force`                      |

---

## License

This project is part of the **LMS Platform**.
© 2025 – Managed by the Engineering Team.