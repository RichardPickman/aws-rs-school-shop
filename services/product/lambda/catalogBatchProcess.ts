import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { Product } from '../../../types';

type RawProduct = Omit<Product, 'id'>;

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || '';
const TOPIC_ARN = process.env.TOPIC_ARN || '';
const SUBSCRIPTION_EMAIL = process.env.SUBSCRIPTION_EMAIL || '';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const snsClient = new SNSClient();

export const handler = async (event: SQSEvent) => {
    console.log('Processing catalog items...');

    const products: RawProduct[] = event.Records.map((record) => JSON.parse(record.body));

    for (const product of products) {
        const { title, description, price, count } = product;

        console.log(`Processing ${title}...`);
        const id = randomUUID();

        try {
            const transcationCommand = new TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: PRODUCTS_TABLE_NAME,
                            Item: {
                                id,
                                title,
                                description,
                                price,
                            },
                        },
                    },
                    {
                        Put: {
                            TableName: STOCK_TABLE_NAME,
                            Item: {
                                product_id: id,
                                count,
                            },
                        },
                    },
                ],
            });

            console.log('Sending product command with title: ', title);

            await docClient.send(transcationCommand);

            console.log('Product ' + title + ' created');
        } catch (err: unknown) {
            console.error('Error processing product: ', err);
        }
    }

    console.log('Products created');

    try {
        const catalogSubscription = new SubscribeCommand({
            TopicArn: TOPIC_ARN,
            Protocol: 'email',
            Endpoint: SUBSCRIPTION_EMAIL,
        });

        console.log('Sending catalog subscription...');

        await snsClient.send(catalogSubscription);

        return {
            statusCode: 201,
            body: JSON.stringify({ message: `Products created and subscription created` }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Error processing event: ${error}` }),
        };
    }
};
