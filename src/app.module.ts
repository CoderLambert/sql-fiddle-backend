import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SqlModule } from './sql/sql.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..', 'public'), // 图片存放目录
      serveRoot: '/static', // 可选，设置访问前缀
    }),
    AuthModule, SqlModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
