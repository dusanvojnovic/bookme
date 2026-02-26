import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServiceCategory, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const role =
      dto.role === 'provider' ? UserRole.PROVIDER : UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        role,
      },
    });

    if (role === UserRole.PROVIDER) {
      if (!dto.serviceCategory) {
        throw new BadRequestException('Service category is required');
      }

      const serviceCategory = dto.serviceCategory as ServiceCategory;
      if (!Object.values(ServiceCategory).includes(serviceCategory)) {
        throw new BadRequestException('Invalid service category');
      }

      await this.prisma.providerProfile.create({
        data: {
          userId: user.id,
          companyName: dto.companyName ?? null,
          serviceCategory,
        },
      });
    }

    return this.signToken(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);

    if (!valid) {
      throw new BadRequestException('Invalid credentials');
    }

    return this.signToken(user.id, user.role);
  }

  private signToken(userId: string, role: UserRole) {
    const payload = { sub: userId, role };

    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
