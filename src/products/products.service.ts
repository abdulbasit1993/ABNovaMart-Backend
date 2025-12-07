import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { cloudinary } from 'src/config/cloudinary.config';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    const imageUrls = files?.map((file) => file.path) || [];

    if (imageUrls.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        price: createProductDto.price.toString(),
        images: imageUrls,
        tags: createProductDto.tags || [],
        isActive: createProductDto.isActive ?? true,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException('Product not found');

    let updatedImages = product.images;

    if (files && files.length > 0) {
      // Optional: Delete old images from Cloudinary
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split('/').pop()?.split('.')[0];

        if (publicId) {
          await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
        }
      }
      updatedImages = files.map((file) => file.path);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        price: updateProductDto.price?.toString(),
        images: updatedImages,
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Delete images from Cloudinary
    for (const imageUrl of product.images) {
      const publicId = imageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
      }
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
