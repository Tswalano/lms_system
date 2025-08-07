#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LmsBackendStack } from '../lib/lms-backend-stack';

const app = new cdk.App();
new LmsBackendStack(app, 'LmsBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.CDK_DEPLOY_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.CDK_DEPLOY_REGION,

  },
});