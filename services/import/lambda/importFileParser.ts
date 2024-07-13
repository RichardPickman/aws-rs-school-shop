import {
    CopyObjectCommand,
    CopyObjectCommandInput,
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const clientSqs = new SQSClient();

const CATALOG_QUEUE_URL = process.env.CATALOG_QUEUE_URL || '';

const createSqsItem = async (product: string) => {
    console.log('Creating SQS item: ', product);

    const SqsSendMessage = new SendMessageCommand({
        QueueUrl: CATALOG_QUEUE_URL,
        MessageBody: JSON.stringify(product),
    });

    try {
        await clientSqs.send(SqsSendMessage);

        console.log('Successfully sent message to SQS');
    } catch (err) {
        console.log('Error occured while sending message to SQS: ', err);
    }
};

const readStream = (stream: Readable) =>
    new Promise<Error | void>((resolve, reject) =>
        stream.pipe(csvParser()).on('data', createSqsItem).on('error', reject).on('end', resolve),
    );

const copyFileAndDeleteOriginal = async (bucket: string, key: string, client: S3Client) => {
    console.log('Preparing to copy file to parsed bucket with key: ', key);
    const parsedKey = key.replace('uploaded', 'parsed');

    const copyParams: CopyObjectCommandInput = {
        Bucket: bucket,
        Key: parsedKey,
        CopySource: bucket + '/' + key,
    };

    console.log('Copying file to parsed bucket with key: ', parsedKey);
    console.log('Parameters: ', copyParams);

    try {
        await client
            .send(new CopyObjectCommand(copyParams))
            .then((data) => console.log('Successfully copied object'))
            .catch((err) => console.log('Error occured while copying object: ', err));

        await client
            .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
            .then((data) => console.log('Successfully deleted object'))
            .catch((err) => console.log('Error occured while deleting object: ', err));

        console.log(`File moved to ${parsedKey}`);
    } catch (err) {
        console.log('Error occured while processing file', err);
    }
};

export const handler = async (event: S3Event) => {
    console.log('Logging the new csv intestines: ', event.Records);

    const client = new S3Client();
    const records = event.Records.filter((record) => record.s3.object.key.startsWith('uploaded/'));

    for (const record of records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        if (!key.endsWith('.csv')) {
            console.log('File is not a csv file');

            continue;
        }

        const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

        if (!response.Body) {
            console.log('No body found');

            return;
        }

        const stream = response.Body as Readable;

        await readStream(stream);
        await copyFileAndDeleteOriginal(bucket, key, client);
    }
};
