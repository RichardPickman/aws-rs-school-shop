#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ImportServiceStack } from '../import-service/stack/import-service.lib';
import { ProductsServiceStack } from '../product-service/stack/product-service.lib';

const app = new cdk.App();
new ProductsServiceStack(app, 'ProductsServiceStack');
new ImportServiceStack(app, 'ImportServiceStack');
