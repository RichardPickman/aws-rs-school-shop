import { Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AuthorizationType, Cors, LambdaIntegration, RestApi, TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import path from 'path';
import { CATALOG_QUEUE_URL, IMPORT_BUCKET_NAME, QUEUE_SQS_ARN } from '../../constants';
import { commonLambdaProps, rootDir } from './helpers';

const lambdaPath = path.join(rootDir, 'services', 'import', 'lambda');

export class ImportServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Import values from other stacks.
        const authorizationHandlerArn = Fn.importValue('AuthorizationHandlerArn');
        const authorizationHandler = Function.fromFunctionArn(this, 'AuthorizationHandler', authorizationHandlerArn);

        // Token authorizer.
        const tokenAuthorizer = new TokenAuthorizer(this, 'TokenAuthorizer', {
            handler: authorizationHandler,
            authorizerName: 'TokenAuthorizer',
        });

        const importProductsFile = new NodejsFunction(this, 'ImportProductsFile', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'importProductsFile.ts'),
            environment: {
                ...commonLambdaProps.environment,
                BUCKET_NAME: IMPORT_BUCKET_NAME,
            },
        });

        const importFileParser = new NodejsFunction(this, 'ImportFileParser', {
            ...commonLambdaProps,
            timeout: Duration.seconds(10),
            entry: path.join(lambdaPath, 'importFileParser.ts'),
            environment: {
                CATALOG_QUEUE_URL: CATALOG_QUEUE_URL,
            },
        });

        const bucket = Bucket.fromBucketName(this, 'ImportBucket', IMPORT_BUCKET_NAME);

        const bucketPolicy = new PolicyStatement({
            actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject', 's3:CopyObject'],
            resources: [`${bucket.bucketArn}`, `${bucket.bucketArn}/*`],
        });

        const queuePolicy = new PolicyStatement({
            actions: ['sqs:SendMessage'],
            resources: [QUEUE_SQS_ARN],
        });

        const authorizationPolicy = new PolicyStatement({
            actions: ['lambda:InvokeFunction'],
            resources: [authorizationHandlerArn],
        });

        importProductsFile.addToRolePolicy(bucketPolicy);
        importFileParser.addToRolePolicy(bucketPolicy);
        importFileParser.addToRolePolicy(queuePolicy);

        authorizationHandler.addToRolePolicy(authorizationPolicy);

        bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(importFileParser));

        const api = new RestApi(this, 'ImportService', {
            restApiName: 'ImportService',
        });

        const rootEndpoint = api.root.addResource('import', {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
            },
        });

        rootEndpoint.addMethod('GET', new LambdaIntegration(importProductsFile), {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: tokenAuthorizer,
        });
    }
}
