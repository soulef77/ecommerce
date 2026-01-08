import {
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Abaya Sayyida', description: 'Nom du produit' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'abaya-sayyida',
    description: 'Slug unique du produit',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'Abaya élégante en coton bio',
    description: 'Description du produit',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 24500,
    description: 'Prix en centimes (245.00€ = 24500)',
  })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Produit actif ou non',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['cat-id-1', 'cat-id-2'],
    required: false,
    description: 'IDs des catégories',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];
}
