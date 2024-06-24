import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from '../constants';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {
    const productId = event.pathParameters?.productId;

    if (!productId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'productId and title are required' }),
        };
    }

    const getProductCommand = new GetCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: {
            id: productId,
        },
    });
    const stockGetCommand = new GetCommand({
        TableName: STOCK_TABLE_NAME,
        Key: {
            product_id: productId,
        },
    });

    try {
        const productResponse = await docClient.send(getProductCommand);

        if (!productResponse) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                },
                body: JSON.stringify({ message: 'Product not found' }),
            };
        }

        const stockResponse = await docClient.send(stockGetCommand);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...productResponse.Item, count: stockResponse.Item?.count || 0 }),
        };
    } catch (error: unknown) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Unknown occured while getting product',
            }),
        };
    }
};
