import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import express from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as userInterface from '../auth/interfaces/user.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  createPaymentIntent(
    @CurrentUser() user: userInterface.UserPayload,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      user.id,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: express.Request,
  ) {
    // Vérifiez que rawBody est disponible et est un Buffer
    if (!request['rawBody'] || !(request['rawBody'] instanceof Buffer)) {
      throw new Error('Raw body is required and must be a Buffer');
    }

    return this.paymentsService.handleWebhook(signature, request['rawBody']);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:orderId')
  getPaymentStatus(
    @CurrentUser() user: userInterface.UserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, user.id);
  }
}
