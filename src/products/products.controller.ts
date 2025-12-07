import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadInterceptor } from './interceptors/file-upload.interceptor';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // @Post()
  // @UseInterceptors(
  //     FilesInterceptor('images', 10, {
  //         storage: diskStorage({
  //             destination: './temp/uploads',
  //             filename: (req, file, cb) => {
  //                 const randomName = Array(32)
  //                 .fill(null)
  //                 .map(() => Math.round(Math.random() * 16).toString(16))
  //                 .join('');
  //                 cb(null, `${}`)
  //             }
  //         })
  //     })
  // )
}
