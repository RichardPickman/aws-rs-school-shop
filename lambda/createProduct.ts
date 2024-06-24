import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent) => {
    const { id, name, description, price } = JSON.parse(event.body || '{}');

    if (!id || !name || !description || !price) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: JSON.stringify({ message: 'Invalid item properties' }),
        };
    }

    const product = new PutCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Item: {
            id,
            name,
            description,
            price,
        },
    });

    try {
        const response = await docClient.send(product);

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: JSON.stringify({ message: 'Product successfully created' }),
        };
    } catch (err: unknown) {
        const error = err as { message: string };
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: JSON.stringify({
                message: error.message,
            }),
        };
    }
};
