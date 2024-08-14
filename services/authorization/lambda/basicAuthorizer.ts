import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

const richardpickman = 'TEST_PASSWORD';

const generatePolicy = (principalId: string, effect: string, resource: string) => ({
    principalId: principalId,
    policyDocument: {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            },
        ],
    },
});

export const handler = async (event: APIGatewayTokenAuthorizerEvent) => {
    console.log('This handler is called by API Gateway', event);

    const token = event.authorizationToken;

    console.log('Proceeding with token', token);

    if (!token) {
        console.log('No token');

        return generatePolicy('unauthenticated', 'Deny', '*');
    }

    const [key, value] = token.split(' ');

    if (key !== 'Basic') {
        console.log('No Basic token');

        return generatePolicy('unauthenticated', 'Deny', '*');
    }

    const decoded = Buffer.from(value, 'base64').toString('ascii');

    const [username, password] = decoded.split(':');

    if (password !== richardpickman) {
        console.log('Password does not match with decoded value: ', decoded);

        return generatePolicy('unauthenticated', 'Deny', '*');
    }

    return generatePolicy('authenticated', 'Allow', '*');
};
