import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path from 'path';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from '../constants';

export class ProductsServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const productsTable = new Table(this, PRODUCTS_TABLE_NAME, {
            tableName: PRODUCTS_TABLE_NAME,
            partitionKey: { name: 'id', type: AttributeType.NUMBER },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const stocksTable = new Table(this, STOCK_TABLE_NAME, {
            tableName: STOCK_TABLE_NAME,
            partitionKey: {
                name: 'product_id',
                type: AttributeType.NUMBER,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const dbPolicy = new PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem'],
            resources: [productsTable.tableArn, stocksTable.tableArn],
        });

        const rootDir = path.join(__dirname, '..');

        const getProductById = new NodejsFunction(this, 'GetProductByIdHandler', {
            runtime: Runtime.NODEJS_20_X,
            projectRoot: rootDir,
            entry: path.join(rootDir, '/lambda/getProductById.ts'),
            depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
            },
            environment: {
                PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME,
                STOCK_TABLE_NAME: STOCK_TABLE_NAME,
            },
        });

        const getProductsList = new NodejsFunction(this, 'GetProductsHandler', {
            runtime: Runtime.NODEJS_20_X,
            projectRoot: rootDir,
            entry: path.join(rootDir, '/lambda/getProducts.ts'),
            depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
            },
            environment: {
                PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME,
                STOCK_TABLE_NAME: STOCK_TABLE_NAME,
            },
        });

        const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
            runtime: Runtime.NODEJS_20_X,
            projectRoot: rootDir,
            entry: path.join(rootDir, '/lambda/createProduct.ts'),
            depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
            },
            environment: {
                PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME,
                STOCK_TABLE_NAME: STOCK_TABLE_NAME,
            },
        });

        getProductById.addToRolePolicy(dbPolicy);
        getProductsList.addToRolePolicy(dbPolicy);
        createProduct.addToRolePolicy(dbPolicy);

        const api = new RestApi(this, 'ProductsService', {
            restApiName: 'ProductsService',
        });

        const productsEndpoit = api.root.addResource('products');
        const productByIdEndpoint = productsEndpoit.addResource('{id}');

        productsEndpoit.addMethod('POST', new LambdaIntegration(createProduct));
        productsEndpoit.addMethod('GET', new LambdaIntegration(getProductsList));
        productByIdEndpoint.addMethod('GET', new LambdaIntegration(getProductById));

        new CfnOutput(this, 'Products table', { value: productsTable.tableName });
        new CfnOutput(this, 'Stock table', { value: stocksTable.tableName });
    }
}
