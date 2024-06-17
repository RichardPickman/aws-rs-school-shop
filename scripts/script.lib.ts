import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';

export class ProductsServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

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

        const api = new RestApi(this, 'ProductsService', {
            restApiName: 'ProductsService',
        });

        const productsEndpoit = api.root.addResource('products');
        const productByIdEndpoint = productsEndpoit.addResource('{id}');

        productsEndpoit.addMethod('GET', new LambdaIntegration(getProductsList));
        productByIdEndpoint.addMethod('GET', new LambdaIntegration(getProductById));
    }
}
