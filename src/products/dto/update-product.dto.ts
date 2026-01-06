export class UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  categoryIds?: string[];
}
