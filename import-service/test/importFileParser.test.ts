jest.mock('@aws-sdk/client-s3');
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../lambda/importFileParser';

const TEST_RECORD = {
    eventName: 'ObjectCreated:Put',
    s3: {
        bucket: {
            name: 'test-bucket',
        },
        object: {
            key: 'uploaded/test.csv',
        },
    },
};

const client = mockClient(S3Client);

beforeEach(() => {
    client.reset();
});

describe('importFileParser', () => {
    it('Should pass all included tests with valid data', async () => {
        const logSpy = jest.spyOn(global.console, 'log');
        const event = { Records: [TEST_RECORD] };

        // @ts-ignore ignore Body is not null, but it is
        client.on(GetObjectCommand).resolves({ Body: null });

        const response = await handler(event as S3Event);

        expect(logSpy).toHaveBeenCalledWith('Logging the new csv intestines: ', [TEST_RECORD]);
    });

    it('Should log if no body is found', async () => {
        const event = { Records: [] };

        // @ts-ignore ignore Body is not null, but it is
        client.on(GetObjectCommand).resolves({ Body: null });

        const response = await handler(event as S3Event);

        expect(response).toHaveBeenCalledTimes(1);
    });
});
