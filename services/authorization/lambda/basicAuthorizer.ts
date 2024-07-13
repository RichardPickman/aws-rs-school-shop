import { SQSEvent } from 'aws-lambda';

const richardpickman = 'TEST_PASSWORD';

export const handler = async (event: SQSEvent) => {
    console.log('Processing catalog items...');

    return {
        statusCode: 201,
        body: JSON.stringify({ message: `Successfully got request` }),
    };
};
