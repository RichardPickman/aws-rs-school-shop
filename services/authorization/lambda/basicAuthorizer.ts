import { SQSEvent } from 'aws-lambda';

const richardpickman = 'TEST_PASSWORD';

export const handler = async (event: SQSEvent) => {
    console.log('This handler is called by API Gateway');

    return {
        statusCode: 201,
        body: JSON.stringify({ message: `Successfully got request` }),
    };
};
