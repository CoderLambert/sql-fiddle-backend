import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { SqlService } from './sql.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sql')
export class SqlController {
  constructor(private sqlService: SqlService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('execute')
  execute(@Request() req, @Body('query') query: string) {
    const userId = req.user.userId;
    return this.sqlService.execute(userId, query);
  }
}
