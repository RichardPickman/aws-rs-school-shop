import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { getConfig, recipients } from './mappers';

@Controller('*')
export class AppController {
  constructor() {}

  private async handleCart(@Req() req: Request) {
    const config = getConfig(req.method, req.body, req.headers);

    const request = await fetch(recipients.cart, config);

    if (request.status > 299) {
      console.log('Backend responded with error', request.status);

      throw new HttpException(
        'Endpoint returned error',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return request.json();
  }

  private async handleProduct(@Req() req: Request) {
    const config = getConfig(req.method, req.body, req.headers);

    const request = await fetch(recipients.product, config);

    if (request.status > 299) {
      console.log('Backend responded with error', request.status);

      throw new HttpException(
        'Endpoint returned error',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return request.json();
  }

  @All()
  handleEndpoint(@Req() req: Request) {
    const [path] = req.url.split('?');
    const paths = path.split('/').filter(Boolean);
    const [cart, product] = Object.keys(recipients);

    if (paths[0] === cart) {
      return this.handleCart(req);
    }

    if (paths[0] === product) {
      return this.handleProduct(req);
    }

    throw new HttpException('Cannot process request', HttpStatus.BAD_GATEWAY);
  }
}
