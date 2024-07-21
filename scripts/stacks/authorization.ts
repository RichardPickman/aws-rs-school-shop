import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'path';
import { commonLambdaProps } from './helpers';

const rootDir = path.join(__dirname, '../../');
const lambdaPath = path.join(rootDir, 'services', 'authorization', 'lambda');

export class AuthorizationServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Lambda functions.
        const authorizationHandler = new NodejsFunction(this, 'AuthorizationHandler', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'basicAuthorizer.ts'),
        });

        new CfnOutput(this, 'AuthorizationHandlerArn', {
            value: authorizationHandler.functionArn,
            exportName: 'AuthorizationHandlerArn',
        });
    }
}
