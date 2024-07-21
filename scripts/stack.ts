#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { AuthorizationServiceStack } from './stacks/authorization';
import { ImportServiceStack } from './stacks/import';
import { ProductsServiceStack } from './stacks/product';

const app = new cdk.App();

new ProductsServiceStack(app, 'ProductsServiceStack');
new ImportServiceStack(app, 'ImportServiceStack');
new AuthorizationServiceStack(app, 'AuthorizationServiceStack');
