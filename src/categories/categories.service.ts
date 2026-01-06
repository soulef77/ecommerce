import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Vérifier que le slug n'existe pas déjà
    const existing = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: { position: 'asc' }, take: 1 },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: { position: 'asc' }, take: 1 },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    // Si le slug change, vérifier qu'il n'existe pas déjà
    if (updateCategoryDto.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}