import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('add')
  async create(@Body() createProductCategoryDto: CreateProductCategoryDto) {
    const productCategory = await this.productCategoriesService.create(
      createProductCategoryDto,
    );

    return {
      success: true,
      message: 'Product category created successfully',
      data: productCategory,
    };
  }

  @Get()
  async findAll() {
    const productCategories = await this.productCategoriesService.findAll();

    return {
      success: true,
      data: productCategories,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const productCategory = await this.productCategoriesService.findOne(id);

    return {
      success: true,
      data: productCategory,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
  ) {
    const productCategory = await this.productCategoriesService.update(
      id,
      updateProductCategoryDto,
    );

    return {
      success: true,
      message: 'Product category updated successfully',
      data: productCategory,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.productCategoriesService.remove(id);

    return {
      success: true,
      message: 'Product category deleted successfully',
    };
  }
}
