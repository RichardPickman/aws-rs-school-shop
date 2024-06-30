import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export const handler = async (event: S3Event) => {
    console.log('Logging the new csv intestines: ', event.Records);

    const client = new S3Client();
    const records = event.Records.filter((record) => record.s3.object.key.startsWith('uploaded/'));

    console.log(JSON.stringify(records));

    for (const record of records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

        if (!response.Body) {
            console.log('No body found');

            return;
        }

        console.log('Creating a readable stream');

        const stream = response.Body.transformToWebStream() as import('stream/web').ReadableStream<any>;

        Readable.fromWeb(stream)
            .pipe(csvParser())
            .on('data', (data) => {
                console.log('Data: ', data);
            });
    }
};
