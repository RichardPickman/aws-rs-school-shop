import dotenv from 'dotenv';

dotenv.config();

export const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || '';
export const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || '';
