jest.mock('@aws-sdk/client-s3');
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { randomUUID } from 'crypto';
import { products } from '../../product/lambda/products';
import { handler } from '../lambda/basicAuthorizer';

const getRandomNumber = () => Math.floor(Math.random() * 100);

const event: SQSEvent = {
    Records: [
        {
            messageId: randomUUID(),
            receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a',
            body: JSON.stringify(products[0]),
            attributes: {
                ApproximateReceiveCount: '1',
                SentTimestamp: String(getRandomNumber()),
                SenderId: 'AIDAIENQZJOLO23YVJ4VO',
                ApproximateFirstReceiveTimestamp: String(getRandomNumber()),
            },
            messageAttributes: {},
            md5OfBody: '098f6bcd4621d373cade4e832627b4f6',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:eu-north-1:123456789012:MyQueue',
            awsRegion: 'eu-north-1',
        },
        {
            messageId: randomUUID(),
            receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a',
            body: JSON.stringify(products[1]),
            attributes: {
                ApproximateReceiveCount: '1',
                SentTimestamp: String(getRandomNumber()),
                SenderId: 'AIDAIENQZJOLO23YVJ4VO',
                ApproximateFirstReceiveTimestamp: String(getRandomNumber()),
            },
            messageAttributes: {},
            md5OfBody: '098f6bcd4621d373cade4e832627b4f6',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:eu-north-1:123456789012:MyQueue',
            awsRegion: 'eu-north-1',
        },
    ],
};

const client = new DynamoDBClient({ region: 'eu-north-1' });
const dynamoDbClientMock = mockClient(client);

describe('importFileParser', () => {
    it('Should pass all included tests with valid data', async () => {
        dynamoDbClientMock.on(PutCommand).resolves({});

        const response = await handler(event as SQSEvent);

        expect(response.statusCode).toBe(201);
        expect(response.body).toBe(JSON.stringify({ message: 'Products created and subscription created' }));
    });

    it('Should return 500 if no body is found', async () => {
        dynamoDbClientMock.on(PutCommand).rejects({});

        const response = await handler(event as SQSEvent);

        expect(response.statusCode).toBe(500);
        expect(response.body).toBe(JSON.stringify({ message: jest.fn(String) }));
    });
});
