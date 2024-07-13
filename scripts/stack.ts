#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ImportServiceStack } from './stacks/import';
import { ProductsServiceStack } from './stacks/product';

const app = new cdk.App();

new ProductsServiceStack(app, 'ProductsServiceStack');
new ImportServiceStack(app, 'ImportServiceStack');
