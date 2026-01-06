import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // ← Important : rend PrismaService disponible partout
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}