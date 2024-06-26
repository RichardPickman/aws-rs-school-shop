import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';
export const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || '';

export const handler = async () => {
    const productsCommand = new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
    });
    const stockCommand = new ScanCommand({
        TableName: STOCK_TABLE_NAME,
    });

    const productsResponse = await docClient.send(productsCommand);
    const stockResponse = await docClient.send(stockCommand);

    if (!productsResponse.Items || !stockResponse.Items) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
            body: JSON.stringify({ message: 'Products or stock not found' }),
        };
    }

    const products = productsResponse.Items.map((item) => unmarshall(item));
    const stocks = stockResponse.Items.map((item) => unmarshall(item));

    const result = products.map((product) => {
        const stock = stocks.find((stock) => stock.product_id === product.id);

        if (!stock) {
            return {
                ...product,
                count: 0,
            };
        }

        return {
            ...product,
            count: stock.count,
        };
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        },
        body: JSON.stringify({ ...result }),
    };
};
