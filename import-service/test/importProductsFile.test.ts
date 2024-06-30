import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import { handler } from '../lambda/importProductsFile';

describe('getProductById', () => {
    it('Should pass all included tests with valid data', async () => {
        const event = {
            queryParams: {
                name: 'proxy-image.jpg',
            },
            httpMethod: 'GET',
        };

        const image = 'https://test.com/proxy-image.jpg';

        jest.spyOn(s3RequestPresigner, 'getSignedUrl').mockResolvedValue(image);

        const response = await handler(event);

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
