import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import path from 'path';
import { IMPORT_BUCKET_NAME } from '../../constants';

export class ImportServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const rootDir = path.join(__dirname, '../../');

        const importProductsFile = new NodejsFunction(this, 'ImportProductsFile', {
            runtime: Runtime.NODEJS_20_X,
            projectRoot: rootDir,
            entry: path.join(rootDir, '/import-service/lambda/importProductsFile.ts'),
            depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
            environment: {
                BUCKET_NAME: IMPORT_BUCKET_NAME,
            },
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
            },
        });

        const importFileParser = new NodejsFunction(this, 'ImportFileParser', {
            runtime: Runtime.NODEJS_20_X,
            projectRoot: rootDir,
            entry: path.join(rootDir, '/import-service/lambda/importFileParser.ts'),
            depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
            },
            timeout: Duration.seconds(10),
        });

        const bucket = Bucket.fromBucketName(this, 'ImportBucket', IMPORT_BUCKET_NAME);
        const bucketPolicy = new PolicyStatement({
            actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject', 's3:CopyObject'],
            resources: [`${bucket.bucketArn}`, `${bucket.bucketArn}/*`],
        });

        importProductsFile.addToRolePolicy(bucketPolicy);
        importFileParser.addToRolePolicy(bucketPolicy);

        bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(importFileParser));

        const api = new RestApi(this, 'ImportService', {
            restApiName: 'ImportService',
        });

        const rootEndpoint = api.root.addResource('import');

        rootEndpoint.addMethod('GET', new LambdaIntegration(importProductsFile));
    }
}
