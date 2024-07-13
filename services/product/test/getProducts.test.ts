import { handler } from '../lambda/getProducts';
import { products } from '../lambda/products';

describe('getProducts', () => {
    it('should return all products', async () => {
        const response = await handler();

        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(JSON.stringify(products));
    });
});
