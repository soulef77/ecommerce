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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as userInterface from '../auth/interfaces/user.interface';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: userInterface.UserPayload) {
    // ← Vérifiez le typage
    return this.ordersService.create(user.id); // ← user.id doit être passé
  }

  @Get()
  findAll(@CurrentUser() user: userInterface.UserPayload) {
    return this.ordersService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: userInterface.UserPayload,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, user.id);
  }
}