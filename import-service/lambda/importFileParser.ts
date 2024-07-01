import {
    CopyObjectCommand,
    CopyObjectCommandInput,
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const readStream = (stream: Readable) =>
    new Promise<Error | void>((resolve, reject) => {
        stream
            .pipe(csvParser())
            .on('data', (chunk) => console.log('Data: ', chunk))
            .on('error', reject)
            .on('end', () => resolve());
    });

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
