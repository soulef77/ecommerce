import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                  },
                },
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      price: true,
                    },
                  },
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return this.calculateCartTotal(cart);
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    // Vérifier que la variante existe et a du stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: addToCartDto.variantId },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (!variant.product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (variant.stock < addToCartDto.quantity) {
      throw new BadRequestException(`Only ${variant.stock} items available in stock`);
    }

    // Récupérer ou créer le panier
    const cart = await this.getOrCreateCart(userId);

    // Vérifier si l'article existe déjà dans le panier
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: addToCartDto.variantId,
        },
      },
    });

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + addToCartDto.quantity;

      if (variant.stock < newQuantity) {
        throw new BadRequestException(`Only ${variant.stock} items available in stock`);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Créer un nouvel article
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: addToCartDto.variantId,
          quantity: addToCartDto.quantity,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.variant.stock < updateCartItemDto.quantity) {
      throw new BadRequestException(`Only ${cartItem.variant.stock} items available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });

    return this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getOrCreateCart(userId);
  }

  private calculateCartTotal(cart: any) {
    let totalAmount = 0;
    let totalItems = 0;

    if (cart.items) {
      cart.items.forEach((item: any) => {
        const itemPrice = item.variant.product.price;
        totalAmount += itemPrice * item.quantity;
        totalItems += item.quantity;
      });
    }

    return {
      ...cart,
      totalAmount,
      totalItems,
    };
  }
}