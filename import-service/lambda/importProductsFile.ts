import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent } from 'aws-lambda';

const BUCKET_NAME = process.env.BUCKET_NAME || '';

export const handler = async (event: Partial<APIGatewayProxyEvent>) => {
    console.log('Creating a signed url: ', event.body);

    const s3Client = new S3Client();
    const name = event.queryStringParameters?.name;

    if (!name) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: JSON.stringify({ message: 'Missing name parameter' }),
        };
    }

    const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `uploaded/${name}`,
    });

    try {
        const response = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 60 * 60 * 24,
        });

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
            },
            body: response,
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
