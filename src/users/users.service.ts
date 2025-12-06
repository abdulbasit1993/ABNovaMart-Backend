import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        created_at: true,
        updated_at: true,
        cart: true,
        addresses: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
