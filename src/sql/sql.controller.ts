import { Controller, Post, Body } from '@nestjs/common';
import { SqlService } from './sql.service';

@Controller('sql')
export class SqlController {
  constructor(private sqlService: SqlService) {}

  @Post('execute')
  execute(@Body() body: { userId: number; query: string }) {
    return this.sqlService.execute(body.userId, body.query);
  }
}
