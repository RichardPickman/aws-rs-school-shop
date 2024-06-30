import { APIGatewayEvent } from 'aws-lambda';
import { products } from './products';

export async function handler(event: Partial<APIGatewayEvent>) {
    const product = products.find((product) => product.id === Number(event.pathParameters?.id));

    if (!product) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
            body: JSON.stringify({ message: 'Product not found' }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        },
        body: JSON.stringify(product),
    };
}
