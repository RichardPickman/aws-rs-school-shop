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
        const image =
            'https://import-rs-school-service.s3.eu-north-1.amazonaws.com/uploaded/proxy-image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA5FTY7Q56KWA2GDBS%2F20240630%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20240630T144505Z&X-Amz-Expires=86400&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmV1LW5vcnRoLTEiRjBEAiAayPTeoyUDb4gAHUgbF4LGsqzVMm41c5v9vFl%2Bc1WXGgIgDJY%2BLQLvsQ2PxEv5OhTRNlI%2BbM%2BA6qI3mh7i%2FWrJ550qygMISBAAGgw5MDU0MTgwODIxNzIiDLvvDyy3UpJMDDakESqnA6Jr0TEr2YruA30wBIiyKI3G4HLBEZUXcc7P209A3OiqkAS4GGGoT9yp3IknIXB7w9YEaWV7xdy5HyeStdkCZvBCXRePVe7F%2FwpnlGkVlX8CzsWLj5%2F6Yz%2BKVw%2B7Ts3GbvDGcvF1Z5668gm8V4f%2BCHuBXjVSHOx6yzsICrtDTThCnjrwfm%2B77%2B6O8htkPg3TV8MsQZ3cpI%2BoHM9GCLhUkefExrOzwMs6CTTUl1mIWJedAwCB%2FLoV0YC0BtEVJKoWFdP4LQYngT1G7hNQpLNmL9wYOFmeNPn6Glkt0Z%2Fm5xMxctjcxYSJNC%2BEkeh356jlPnR1mkSZztYauA41T4WpLK3G5uuBXsP4%2B3yNGQdKJkO7DWwnkj%2BAbvCtmlL5ExUVKEjnN8JLHNU6oQmzX3eoBArwMo%2F6tp3%2F8cdVmawTqOxJBywaIpPCWDYNDB19Bdjp78WHryrQN4Z14CwgWrgRpiTTcJCz5oTXg6L%2FgdRDMANAeVwSNgyTfND3T4GNzURPHQXvwDDhtFkLcke6XJ2woe5SqX1rLhGwVgmuPoAasjJke7sA1Rjy3DCl2oW0BjqfAfFwDdX7EON5nIL3Mp9XLCMMyLvQwSaGjjb%2BIxAlVahfnYYbewmOVBVF%2FWtj%2FhRcDhFR7HaycFhJji0jdMMdhhGt1JgUV4Vj7yC5tkS3uddSwAg%2BykCUrPUN6uKWtBm5GvTLZ3u%2Bz1zX3TYndP8%2Bg5bk4jRls2LoMGLhKOk%2FRqd8yshkAHGTQFSc0w70omAhzQS8Dg3x70SSfToMH0%2FEXw%3D%3D&X-Amz-Signature=106a227441868b13ed437e1e1050dcbb4c74bbf4e93d32ccc504ff24d96bf8a6&X-Amz-SignedHeaders=host&x-id=GetObject';

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
