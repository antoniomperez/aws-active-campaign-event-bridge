import { Construct } from 'constructs';
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CloudFormationCreateUpdateStackAction,
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
  private readonly pipeline: Pipeline;

  private readonly sourceOutput: Artifact;

  private readonly cdkBuildOutput: Artifact;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, 'ActiveCampaignPipeline', {
      pipelineName: this.stackName,
      crossAccountKeys: false,
    });

    this.sourceOutput = new Artifact('SoruceOutput');

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: props.repositoryOwner,
          repo: props.repositoryName,
          branch: props.repositoryBranch,
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: this.sourceOutput,
        }),
      ],
    });

    this.cdkBuildOutput = new Artifact('cdkBuildOutput');

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: this.sourceOutput,
          outputs: [this.cdkBuildOutput],
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

    this.pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: this.stackName,
          templatePath: this.cdkBuildOutput.atPath(
            `${this.stackName}.template.json`
          ),
          adminPermissions: true,
        }),
      ],
    });
  }
}
