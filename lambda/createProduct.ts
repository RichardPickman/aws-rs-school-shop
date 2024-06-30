import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';
export const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || '';

const requiredFields = ['title', 'description', 'price', 'count'];

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Creating product with provided data: ', event.body);

    const body = event.body ? JSON.parse(event.body) : {};
    const { title, description, price, count } = body;

    if (!title || !description || !price || !count) {
        const missing = requiredFields.filter((key) => !body[key]);

        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: JSON.stringify({ message: 'Missing item values', missing }),
        };
    }

    const id = randomUUID();

    const transaction = new TransactWriteCommand({
        TransactItems: [
            {
                Put: {
                    TableName: PRODUCTS_TABLE_NAME,
                    Item: {
                        id,
                        title,
                        description,
                        price,
                    },
                },
            },
            {
                Put: {
                    TableName: STOCK_TABLE_NAME,
                    Item: {
                        product_id: id,
                        count,
                    },
                },
            },
        ],
    });

    try {
        await docClient.send(transaction);

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
