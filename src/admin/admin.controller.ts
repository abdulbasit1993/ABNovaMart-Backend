import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  async getAllUsers() {
    const users = await this.adminService.getAllUsers();
    return {
      success: true,
      data: users,
    };
  }
}
