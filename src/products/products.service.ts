import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        slug: createProductDto.slug,
        description: createProductDto.description,
        price: createProductDto.price,
        isActive: createProductDto.isActive ?? true,
        categories: {
          connect: createProductDto.categoryIds?.map(id => ({ id })) || [],
        },
      },
      include: {
        categories: true,
        images: true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { include: { images: true } },
        categories: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { include: { images: true } },
        categories: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        slug: updateProductDto.slug,
        description: updateProductDto.description,
        price: updateProductDto.price,
        isActive: updateProductDto.isActive,
        categories: updateProductDto.categoryIds
          ? {
            set: updateProductDto.categoryIds.map(id => ({ id })),
          }
          : undefined,
      },
      include: {
        categories: true,
        images: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}