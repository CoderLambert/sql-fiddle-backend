import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('用户已存在');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // 创建该用户的专属数据库文件
    const userDbPath = `./data/${user.id}.sqlite`;
    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(userDbPath, ''); // 空文件即可，稍后初始化

    return { message: '注册成功', userId: user.id };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('用户不存在');

    const valid = bcrypt.compare(password, user.password);
    if (!valid) throw new BadRequestException('密码错误');
    const token = this.jwtService.sign({ sub: user.id });

    return { message: '登录成功', token };
  }

  test() {
    return 'test';
  }
}
