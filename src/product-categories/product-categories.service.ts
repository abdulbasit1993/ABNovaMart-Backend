import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createProductCategoryDto: CreateProductCategoryDto) {
    const { name, slug, parentId } = createProductCategoryDto;

    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        children: true,
        parent: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        products: true,
      },
    });
  }

  async update(id: string, updateProductCategoryDto: UpdateProductCategoryDto) {
    const { name, slug, parentId } = updateProductCategoryDto;
    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        parentId,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
