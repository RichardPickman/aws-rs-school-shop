jest.mock('@aws-sdk/s3-request-presigner');
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lambda/importProductsFile';

describe('getProductById', () => {
    it('Should pass all included tests with valid data', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            queryStringParameters: {
                name: 'proxy-image.jpg',
            },
            httpMethod: 'GET',
        };

        const getSignedUrlMock: jest.Mock = getSignedUrl as any;

        const image = 'https://test.com/proxy-image.jpg';

        getSignedUrlMock.mockResolvedValue(image);

        const response = await handler(event);

        expect(GetObjectCommand).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(201);
        expect(response.body).toBe(image);
    });

    it('should return 400 if name is not provided', async () => {
        const event = {
            queryParams: {},
            httpMethod: 'GET',
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        expect(response.body).toBe(JSON.stringify({ message: 'Missing name parameter' }));
    });
});
