import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app/app.module';
import { getConfig } from './config';
import { constants } from './config/constants';
import * as fs from 'fs';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

const config = getConfig();

const httpsOptions: HttpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-key.crt'),
  ca: [fs.readFileSync('./secrets/fullchain.ca-bundle')],
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
