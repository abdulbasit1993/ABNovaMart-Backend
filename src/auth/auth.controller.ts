import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(@Body() registerUserDto: RegisterUserDto) {
    const { user, token } =
      await this.authService.registerUser(registerUserDto);

    return {
      success: true,
      message: 'User registered successfully',
      data: user,
      token: token,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body() loginUserDto: LoginUserDto) {
    const { user, token } = await this.authService.login(
      loginUserDto.email,
      loginUserDto.password,
    );

    return {
      success: true,
      message: 'User logged in successfully',
      data: user,
      token: token,
    };
  }
}
