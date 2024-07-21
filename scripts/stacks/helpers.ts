import { Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import { PRODUCTS_TABLE_NAME, STOCK_TABLE_NAME } from '../../constants';

export const rootDir = path.join(__dirname, '../../');
export const commonLambdaProps = {
    runtime: Runtime.NODEJS_20_X,
    projectRoot: rootDir,
    depsLockFilePath: path.join(rootDir, 'pnpm-lock.yaml'),
    environment: {
        PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME,
        STOCK_TABLE_NAME: STOCK_TABLE_NAME,
    },
    bundling: {
        externalModules: ['aws-sdk'],
        minify: false,
    },
};
