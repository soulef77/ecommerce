import { CartModule } from './cart/cart.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    PaymentsModule, // ← Ajoutez ici
  ],
})
export class AppModule {}
