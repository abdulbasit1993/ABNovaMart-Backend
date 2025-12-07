import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { cloudinary } from 'src/config/cloudinary.config';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (!req.files || req.files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const uploadPromises = req.files.map((file: Express.Multer.File) => {
      return cloudinary.uploader.upload(file.path, {
        folder: 'ecommerce/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      });
    });

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map((result) => result.secure_url);

    // Attach uploaded URLs to request for controller/service
    req.uploadedImages = imageUrls;

    return next.handle().pipe(
      map((data) => {
        // Optionally modify response to include URLs
        return data;
      }),
    );
  }
}
