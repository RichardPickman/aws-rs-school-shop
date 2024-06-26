#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ProductsServiceStack } from './script.lib';

const app = new cdk.App();
new ProductsServiceStack(app, 'ProductsServiceStack');
