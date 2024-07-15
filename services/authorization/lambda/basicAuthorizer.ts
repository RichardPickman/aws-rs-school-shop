import { APIGatewayTokenAuthorizerEvent, SQSEvent } from 'aws-lambda';

// const richardpickman = 'TEST_PASSWORD';

export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
    console.log('This handler is called by API Gateway', event);

    return {
        "principalId": 'blahblahblah',
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "execute-api:Invoke",
                "Effect": "Allow",
                "Resource": "*"
            }]
        },
    };
};
