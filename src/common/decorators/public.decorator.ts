import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Use this decorator on any route (or controller) that should be
 * accessible WITHOUT a JWT authentication token.
 *
 * Example:
 *
 * ```typescript
 * @Public()
 * @Get('public-endpoint')
 * getPublicData() {
 *   return this.authService.getPublicData();
 * }
 * ```
 */

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
