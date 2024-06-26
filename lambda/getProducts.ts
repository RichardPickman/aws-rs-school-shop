import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { STOCK_TABLE_NAME } from '../constants';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent) => {
    const productsCommand = new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
    });
    const stockCommand = new ScanCommand({
        TableName: STOCK_TABLE_NAME,
    });

    const productsResponse = await docClient.send(productsCommand);
    const stockResponse = await docClient.send(stockCommand);

    const result = productsResponse.Items?.map((product) => {
        const stock = stockResponse.Items?.find((stockItem) => stockItem.product_id === product.id);

        return {
            ...product,
            count: stock?.count || 0,
        };
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        },
        body: JSON.stringify(result),
    };
};
