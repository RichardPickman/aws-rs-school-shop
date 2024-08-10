import * as dotenv from 'dotenv';
import { IncomingHttpHeaders } from 'http';

dotenv.config();

type RequestConfig = Record<
  string,
  (body?: Record<string, unknown>, headers?: HeadersInit) => RequestInit
>;

export const recipients = {
  cart: process.env.CART_ENDPOINT,
  cart_checkout: process.env.CART_CHECKOUT_ENDPOINT,
  product: process.env.PRODUCT_ENDPOINT,
};

export const requestConfigs: RequestConfig = {
  GET: (_body, headers) => ({
    method: 'GET',
    headers,
  }),
  POST: (body, headers) => ({
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }),
  PUT: (body, headers) => ({
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  }),
  DELETE: (body, headers) => ({
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  }),
};

const getHeadersWithAuthIfPresented = (rawHeaders: IncomingHttpHeaders) => {
  const headers = new Headers();

  if (rawHeaders['authorization']) {
    headers.append('authorization', rawHeaders['authorization']);
  }

  return headers;
};

export const getConfig = (
  method: string,
  body: Record<string, unknown>,
  rawHeaders: IncomingHttpHeaders,
) => {
  const headers = getHeadersWithAuthIfPresented(rawHeaders);

  if (method === 'GET') {
    return requestConfigs.GET({}, headers);
  }

  if (method === 'POST') {
    return requestConfigs.POST(body, headers);
  }

  if (method === 'PUT') {
    return requestConfigs.PUT(body, headers);
  }

  if (method === 'DELETE') {
    return requestConfigs.DELETE(body, headers);
  }
};
