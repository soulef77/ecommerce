import * as common from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as userInterface from '../auth/interfaces/user.interface';

@common.Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @common.UseGuards(JwtAuthGuard)
  @common.Post('create-payment-intent')
  createPaymentIntent(
    @CurrentUser() user: userInterface.UserPayload,
    @common.Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      user.id,
    );
  }

  @common.Post('webhook')
  async handleWebhook(
    @common.Headers('stripe-signature') signature: string,
    @common.Req() request: common.RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, request.rawBody);
  }

  @common.UseGuards(JwtAuthGuard)
  @common.Get('status/:orderId')
  getPaymentStatus(
    @CurrentUser() user: userInterface.UserPayload,
    @common.Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, user.id);
  }
}