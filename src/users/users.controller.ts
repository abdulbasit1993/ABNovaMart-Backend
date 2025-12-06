import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { userId: string }) {
    const user_id = user.userId;
    const userData = await this.usersService.findById(user_id);

    return {
      success: true,
      message: 'Profile fetched successfully',
      data: userData,
    };
  }
}
