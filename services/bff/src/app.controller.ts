import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { getConfig, recipients } from './mappers';

const handleFetch = async (url: string, config: RequestInit) => {
  try {
    const request = await fetch(url, config);

    if (request.status >= 400) {
      console.log('Backend responded with error', request.status);

      throw new HttpException(
        'Endpoint returned error',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return request.json();
  } catch (error) {
    console.log('Backend responded with error', error);

    throw new HttpException('Endpoint returned error', HttpStatus.BAD_GATEWAY);
  }
};

@Controller('*')
export class AppController {
  constructor() {}

  @All()
  handleEndpoint(@Req() req: Request) {
    const [path] = req.url.split('?');
    const paths = path.split('/').filter(Boolean);
    const [cart, cart_checkout, product] = Object.keys(recipients);

    if (paths[0] === cart) {
      return handleFetch(
        recipients.cart,
        getConfig(req.method, req.body, req.headers),
      );
    }

    if (paths[0] === cart_checkout) {
      return handleFetch(
        recipients.cart_checkout,
        getConfig(req.method, req.body, req.headers),
      );
    }

    if (paths[0] === product) {
      return handleFetch(
        recipients.product,
        getConfig(req.method, req.body, req.headers),
      );
    }

    throw new HttpException('Cannot process request', HttpStatus.BAD_GATEWAY);
  }
}
