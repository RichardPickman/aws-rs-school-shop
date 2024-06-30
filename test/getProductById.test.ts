import { handler } from '../lambda/getProductById';
import { products } from '../lambda/products';

describe('getProductById', () => {
    it('should return 404 if product not found', async () => {
        const event = {
            pathParameters: {
                id: '100',
            },
            httpMethod: 'GET',
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(404);
        expect(response.body).toBe(JSON.stringify({ message: 'Product not found' }));
    });

    it('should return product if found', async () => {
        const event = {
            pathParameters: {
                id: String(products[0].id),
            },
            httpMethod: 'GET',
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(JSON.stringify(products[0]));
    });
});
