import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import {LambdaPowertoolsLayer} from 'cdk-aws-lambda-powertools-layer';
import * as apigwsqs from './apigw-sqs';

export class TracingForDistributedAppsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'Api', {
      deployOptions: {
        stageName: 'dev',
        tracingEnabled: true
      },
    });

    const queueOne = new sqs.Queue(this, 'QueueOne', {
      queueName: 'QueueOne',
    });

    new apigwsqs.ApiGwSqsConstruct(this, 'apiGwSqs', {
      apiGateway: api,
      sqsQueue: queueOne
    })

    const queueTwo = new sqs.Queue(this, 'QueueTwo', {
      queueName: 'QueueTwo',
    });

    const powertoolsLayerPython = new LambdaPowertoolsLayer(this, 'PowertoolsLayer', {runtimeFamily: lambda.RuntimeFamily.PYTHON});

    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'Powertools', "arn:aws:lambda:us-east-1:017000801446:layer:AWSLambdaPowertoolsPythonV2:67")
    
    const lambdaOne = new lambda.Function(this, 'LambdaOne', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'one.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "DEST_QUEUE_URL": queueTwo.queueUrl,
        "POWERTOOLS_SERVICE_NAME": "serviceOne",
        "POWERTOOLS_LOG_LEVEL": "INFO"
      },
    });
    queueOne.grantConsumeMessages(lambdaOne);
    queueTwo.grantSendMessages(lambdaOne);
    lambdaOne.addEventSource(new eventsources.SqsEventSource(queueOne));

    const lambdaTwo = new lambda.Function(this, 'LambdaTwo', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'two.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        "POWERTOOLS_SERVICE_NAME": "serviceOne",
        "POWERTOOLS_LOG_LEVEL": "INFO"
      },
    });
    queueTwo.grantConsumeMessages(lambdaTwo);
    lambdaTwo.addEventSource(new eventsources.SqsEventSource(queueTwo));
  }
}
