#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline/pipeline-stack';

const app = new cdk.App();

new PipelineStack(app, 'ActiveCampaignPipelineTestStack', {
  env: {
    region: 'eu-central-1',
    account: app.node.tryGetContext('PipelineTestDeploymentAccount'),
  },
  repositoryOwner: 'antoniomperez',
  repositoryName: 'aws-active-campaign-event-bridge',
  repositoryBranch: 'v1-main',
});
