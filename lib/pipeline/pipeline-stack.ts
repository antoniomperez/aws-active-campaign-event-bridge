import { Construct } from 'constructs';
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CodeBuildAction,
  GitHubSourceAction,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';

interface PipelineStackProps extends StackProps {
  repositoryOwner: string;
  repositoryName: string;
  repositoryBranch: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'ActiveCampaignPipeline', {
      pipelineName: this.stackName,
      crossAccountKeys: false,
    });

    const sourceOutput = new Artifact('SoruceOutput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: props.repositoryOwner,
          repo: props.repositoryName,
          branch: props.repositoryBranch,
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: sourceOutput,
        }),
      ],
    });

    const cdkBuildOuyput = new Artifact('cdkBuildOutput');

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: sourceOutput,
          outputs: [cdkBuildOuyput],
          checkSecretsInPlainTextEnvVariables: false,
          environmentVariables: {
            GITHUB: {
              value: SecretValue.secretsManager('github-token'),
            },
          },
          project: new PipelineProject(this, 'CDKBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              `build-specs/${this.stackName}-build-spec.yml`
            ),
          }),
        }),
      ],
    });
  }
}
