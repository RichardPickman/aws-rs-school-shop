import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand, TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { STOCK_TABLE_NAME } from '../constants';
import { Product } from '../types';
import { products } from './products';

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const createProduct = async (item: Omit<Product, 'id'>) => {
    const { title, description, price } = item;
    const id = randomUUID();
    const count = Math.floor(Math.random() * 100);

    const command: TransactWriteCommandInput = {
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
    };

    const transaction = new TransactWriteCommand(command);
    const product = await docClient.send(transaction);

    return {
        ...item,
        count,
    };
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Populating database');

    const promisedItems = products.map(createProduct);
    const result = await Promise.all(promisedItems);

    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
        },
        body: JSON.stringify(result),
    };
};
