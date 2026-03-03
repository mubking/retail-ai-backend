import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  login(password: string) {
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (password !== adminPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.jwtService.sign({ role: 'admin' }, { expiresIn: '7d' });

    return { token };
  }
}