import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app/app.module';
import { getConfig } from './config';
import { constants } from './config/constants';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const config = getConfig();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'fatal', 'verbose'],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: '*', // Frontend domain
    credentials: true, // Allow cookies
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Bookme')
    .setDescription('Backend part')
    .setVersion('v1')
    .addServer(config.APP_HOST, 'Local server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      constants.authPatternName,
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.APP_PORT, () =>
    console.log(`Server started on port =  ${config.APP_PORT}`),
  );
}
bootstrap();
