import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from '../constants';

export class ProductsServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

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

        const getProductById = new Function(this, 'GetProductByIdHandler', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset(path.join(__dirname, '../lambda')),
            handler: 'getProductById.handler',
        });

        const getProductsList = new Function(this, 'GetProductsHandler', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset(path.join(__dirname, '../lambda')),
            handler: 'getProducts.handler',
        });

        const createProduct = new Function(this, 'CreateProductHandler', {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromAsset(path.join(__dirname, '../lambda')),
            handler: 'createProduct.handler',
        });

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
