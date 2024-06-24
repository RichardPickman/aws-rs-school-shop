import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { PRODUCTS_TABLE_NAME } from '../constants';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {
    const command = new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
    });

    const productsResponse = await docClient.send(command);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        },
        body: JSON.stringify(productsResponse.Items),
    };
};
