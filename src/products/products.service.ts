import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { cloudinary } from 'src/config/cloudinary.config';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private cleanupTempFiles(): void {
    setTimeout(() => {
      fs.readdir('./temp/uploads', (err, files) => {
        if (err) return;
        for (const file of files) {
          fs.unlink(path.join('./temp/uploads', file), () => {});
        }
      });
    }, 60_000); // Clean after 1 minute
  }

  async create(createProductDto: CreateProductDto, uploadedImages: string[]) {
    const imageUrls = (uploadedImages || []).filter((u) => u != null);

    if (imageUrls.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    const product = await this.prisma.product.create({
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

    // Cleanup temporary files after product creation
    this.cleanupTempFiles();

    return product;
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
    uploadedImages?: string[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException('Product not found');

    let updatedImages = product.images;

    if (uploadedImages && uploadedImages.length > 0) {
      // Optional: Delete old images from Cloudinary
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split('/').pop()?.split('.')[0];

        if (publicId) {
          await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
        }
      }
      updatedImages = uploadedImages.filter((u) => u != null);
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
