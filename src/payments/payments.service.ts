import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }


  async createPaymentIntent(orderId: string, userId: string) {
    // Récupérer la commande
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending');
    }

    // Si un paiement existe déjà, retourner le PaymentIntent existant
    if (order.payment) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        order.payment.stripePaymentIntentId,
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }

    // Créer un nouveau PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: order.totalAmount,
      currency: 'eur',
      metadata: {
        orderId: order.id,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Enregistrer le paiement en base
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer | undefined) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    if (!rawBody) {  // ← Vérification ajoutée
      throw new BadRequestException('Request body is required');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Gérer les différents événements
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Mettre à jour le paiement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED' },
    });

    // Mettre à jour la commande
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    console.log(`✅ Payment succeeded for order: ${payment.orderId}`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Mettre à jour le paiement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    console.log(`❌ Payment failed for order: ${payment.orderId}`);
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return {
      orderId: order.id,
      paymentStatus: order.payment.status,
      orderStatus: order.status,
      amount: order.totalAmount,
    };
  }
}