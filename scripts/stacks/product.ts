import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { AccountPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import path from 'path';
import { PRINCIPAL_ID, PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME, SUBSCRIPTION_EMAIL } from '../../constants';

const rootDir = path.join(__dirname, '../../');
const lambdaPath = path.join(rootDir, 'services', 'product', 'lambda');

const commonLambdaProps = {
    runtime: Runtime.NODEJS_20_X,
    projectRoot: rootDir,
    depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
    environment: {
        PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME,
        STOCK_TABLE_NAME: STOCK_TABLE_NAME,
    },
    bundling: {
        externalModules: ['aws-sdk'],
        minify: false,
    },
};

export class ProductsServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Product service tables.
        const productsTable = new Table(this, PRODUCTS_TABLE_NAME, {
            tableName: PRODUCTS_TABLE_NAME,
            partitionKey: { name: 'id', type: AttributeType.STRING },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const stocksTable = new Table(this, STOCK_TABLE_NAME, {
            tableName: STOCK_TABLE_NAME,
            partitionKey: {
                name: 'product_id',
                type: AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // Topic for creating products.
        const createProductTopic = new Topic(this, 'CreateProductTopic', {
            topicName: 'CreateProductTopic',
            displayName: 'CreateProductTopic',
        });

        // Lambda functions.
        const getProductByIdHandler = new NodejsFunction(this, 'GetProductByIdHandler', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'getProductById.ts'),
        });

        const getProductsListHandler = new NodejsFunction(this, 'GetProductsHandler', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'getProducts.ts'),
        });

        const createProductHandler = new NodejsFunction(this, 'CreateProductHandler', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'createProduct.ts'),
        });

        const populateProductHandler = new NodejsFunction(this, 'PopulateProductHandler', {
            ...commonLambdaProps,
            entry: path.join(lambdaPath, 'populateDatabase.ts'),
        });

        const catalogItemsHandler = new NodejsFunction(this, 'CatalogItemsHandler', {
            ...commonLambdaProps,
            environment: {
                ...commonLambdaProps.environment,
                TOPIC_ARN: createProductTopic.topicArn,
                SUBSCRIPTION_EMAIL: SUBSCRIPTION_EMAIL,
            },
            entry: path.join(lambdaPath, 'catalogBatchProcess.ts'),
        });

        // Queue for catalog items.
        const catalogItemsQueue = new Queue(this, 'CatalogItemsQueue', {
            queueName: 'CatalogItemsQueue',
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // Principal for the topic policy.
        const accessPrincipal = new AccountPrincipal(PRINCIPAL_ID);

        // Policy for the lambda functions.
        const productTopicPolicy = new PolicyStatement({
            actions: ['sns:Subscribe'],
            resources: [createProductTopic.topicArn],
            principals: [accessPrincipal],
        });

        const dbPolicy = new PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem'],
            resources: [productsTable.tableArn, stocksTable.tableArn],
        });

        // Event source for the catalog items.
        catalogItemsHandler.addEventSource(new SqsEventSource(catalogItemsQueue, { batchSize: 5 }));

        // Add permissions to the lambda functions.
        createProductTopic.addToResourcePolicy(productTopicPolicy);
        getProductByIdHandler.addToRolePolicy(dbPolicy);
        getProductsListHandler.addToRolePolicy(dbPolicy);
        createProductHandler.addToRolePolicy(dbPolicy);
        populateProductHandler.addToRolePolicy(dbPolicy);
        catalogItemsHandler.addToRolePolicy(dbPolicy);

        // // Add mine email as subscription to the topic.
        // createProductTopic.addSubscription(new EmailSubscription(SUBSCRIPTION_EMAIL));

        // Add subscriptions to the topic for all emails.
        const emails = ['test@test.com', 'test2@test.com'];

        createProductTopic.addSubscription(new EmailSubscription(SUBSCRIPTION_EMAIL));

        for (const email of emails) {
            createProductTopic.addSubscription(
                new EmailSubscription(email, {
                    filterPolicy: {
                        price: SubscriptionFilter.numericFilter({
                            between: { start: 10, stop: 1000 },
                        }),
                    },
                }),
            );
        }

        // API Gateway.
        const api = new RestApi(this, 'ProductsService', {
            restApiName: 'ProductsService',
        });

        // API Gateway resources.
        const productsEndpoit = api.root.addResource('products');
        const populateEndpoit = api.root.addResource('populate');
        const productByIdEndpoint = productsEndpoit.addResource('{productId}');

        // API Gateway methods.
        productsEndpoit.addMethod('POST', new LambdaIntegration(createProductHandler));
        productsEndpoit.addMethod('GET', new LambdaIntegration(getProductsListHandler));
        productByIdEndpoint.addMethod('GET', new LambdaIntegration(getProductByIdHandler));
        populateEndpoit.addMethod('POST', new LambdaIntegration(populateProductHandler));

        // Outputs.
        new CfnOutput(this, 'Products table', { value: productsTable.tableName });
        new CfnOutput(this, 'Queue Url', { value: catalogItemsQueue.queueUrl });
        new CfnOutput(this, 'Stock table', { value: stocksTable.tableName });
    }
}
