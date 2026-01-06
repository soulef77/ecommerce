import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string) {
    console.log('🔍 userId reçu:', userId);
    console.log('🔍 type de userId:', typeof userId);

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Récupérer le panier
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculer le montant total
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.variant.product.price * item.quantity;
      totalAmount += itemTotal;

      return {
        productName: item.variant.product.name,
        price: item.variant.product.price,
        color: item.variant.color,
        size: item.variant.size,
        quantity: item.quantity,
      };
    });

    // Vérifier le stock
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.variant.product.name}`,
        );
      }
    }

    // Créer la commande
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Réduire le stock
    for (const item of cart.items) {
      await this.prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Vider le panier
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}