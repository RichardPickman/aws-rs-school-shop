import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

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

        const stream = response.Body.transformToWebStream() as ReadableStream<any>;

        Readable.fromWeb(stream)
            .pipe(csvParser())
            .on('data', (data) => console.log('Data: ', data))
            .on('error', (err) => console.log('Error: ', err))
            .on('end', async () => {
                try {
                    console.log('End of stream');

                    const parsedKey = `parsed/${key.split('/').pop()}`;

                    const copyParams = {
                        Bucket: bucket,
                        Key: parsedKey,
                    };

                    await client
                        .send(new PutObjectCommand(copyParams))
                        .then((data) => console.log('Successfully copied object'))
                        .catch((err) => console.log('Error occured while copying object', err));
                    await client
                        .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
                        .then((data) => console.log('Successfully deleted object'))
                        .catch((err) => console.log('Error occured while deleting object', err));

                    console.log(`File moved to ${parsedKey}`);
                } catch (err) {
                    console.log('Error occured while processing file', err);
                }
            });
    }
};
