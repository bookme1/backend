import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app/app.module';
import { getConfig } from './config';
import { constants } from './config/constants';
import * as fs from 'fs';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

const config = getConfig();

const httpsOptions: HttpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/bookme.kyiv.ua/privkey.pem'), // Do not change it! Pfad is for the deploy server
  cert: fs.readFileSync('/etc/letsencrypt/live/bookme.kyiv.ua/fullchain.pem'),
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
    logger: ['log', 'error', 'warn', 'debug', 'fatal', 'verbose'],
  });

  app.enableCors();
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

  await app.listen(config.APP_PORT);
}
bootstrap();
