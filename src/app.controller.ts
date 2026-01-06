import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getWelcome() {
    return {
      message: 'Welcome to E-commerce API',
      version: '1.0.0',
      endpoints: {
        products: '/api/products',
        health: '/api/health',
      },
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  getHello = () => {
    return undefined;
  };
}
