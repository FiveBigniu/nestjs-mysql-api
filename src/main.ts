import 'dotenv/config';
import * as path from 'path';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { ValidationPipe } from './pipe/validation.pipe';
import adminConfig from './config/admin.config';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform/transform.interceptor';

const PORT = process.env.PORT || 8080;
const PREFIX = process.env.PREFIX || '/';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // 设置跨站访问
    logger: false,
  });
  // 给请求添加prefix
  app.setGlobalPrefix(PREFIX);

  // 配置api文档信息
  const options = new DocumentBuilder()
    .setTitle('nestjs api文档')
    .setDescription('nestjs api接口文档')
    .setBasePath(PREFIX)
    .addBearerAuth({ type: 'apiKey', in: 'header', name: 'token' })
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${PREFIX}/docs`, app, document);

  // 访问频率限制
  // app.use(
  //   rateLimit({
  //     windowMs: 15 * 60 * 1000, // 15分钟
  //     max: 100, // 限制15分钟内最多只能访问100次
  //   }),
  // );

  //配置静态资源目录
  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: adminConfig.staticPrefixPath,
  });
  // Web漏洞的
  app.use(helmet());

  // 全局注册错误的过滤器(错误异常)
  app.useGlobalFilters(new HttpExceptionFilter());
  // 全局注册拦截器(成功返回格式)
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局使用管道(数据校验)
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(PORT, () => {
    Logger.log(`服务已经启动,请访问:http://wwww.localhost:${PORT}/${PREFIX}`);
  });
}
bootstrap().catch(e => Logger.error('错误', e));
