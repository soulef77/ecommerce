import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as userInterface from '../auth/interfaces/user.interface';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: userInterface.UserPayload) {
    return this.cartService.getOrCreateCart(user.id);
  }

  @Post('items')
  addToCart(
    @CurrentUser() user: userInterface.UserPayload,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Patch('items/:id')
  updateCartItem(
    @CurrentUser() user: userInterface.UserPayload,
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, id, updateCartItemDto);
  }

  @Delete('items/:id')
  removeFromCart(
    @CurrentUser() user: userInterface.UserPayload,
    @Param('id') id: string,
  ) {
    return this.cartService.removeFromCart(user.id, id);
  }

  @Delete()
  clearCart(@CurrentUser() user: userInterface.UserPayload) {
    return this.cartService.clearCart(user.id);
  }
}