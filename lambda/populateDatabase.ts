import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { STOCK_TABLE_NAME } from '../constants';
import { Product } from '../types';
import { products } from './products';

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const createStock = async (id: number) => {
    const count = Math.floor(Math.random() * 100);

    const stockCommand = new PutCommand({
        TableName: STOCK_TABLE_NAME,
        Item: {
            product_id: id,
            count,
        },
    });

    try {
        await docClient.send(stockCommand);

        return { id, count };
    } catch (err: unknown) {
        const error = err as { message: string };

        return { message: error.message };
    }
};

export const createItem = async (item: Product) => {
    const { id, title, description, price } = item;

    const productCommand = new PutCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Item: {
            id,
            title,
            description,
            price,
        },
    });

    const product = await docClient.send(productCommand);
    const stock = await createStock(id);

    return {
        ...item,
        count: stock.count ?? 0,
    };
};

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log('Populating database');

    const promisedItems = products.map(async (item) => {
        const product = await createItem(item);

        return product;
    });

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
