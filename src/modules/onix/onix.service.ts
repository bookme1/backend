import { HttpException, Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { request, RequestOptions, IncomingMessage } from 'http';
import { request as httpsRequest } from 'https';

@Injectable()
export class OnixService {
  private readonly logger = new Logger(OnixService.name);

  // Parse header "www-authenticate"
  private parseAuthenticateHeader(headerValue: string): Record<string, string> {
    // Example: 'Digest realm="testrealm@host.com", qop="auth", nonce="..., opaque="..."'
    const authValues: Record<string, string> = {};
    if (!headerValue) return authValues;

    const parts = headerValue.replace(/^Digest\s+/i, '').split(',');
    parts.forEach((part) => {
      const [key, val] = part.trim().split('=');
      authValues[key] = val?.replace(/"/g, '');
    });
    return authValues;
  }

  // Создаём заголовок Authorization для Digest-аутентификации
  private createDigestHeader(
    auth: Record<string, string>,
    method: string,
    path: string,
    username: string,
    password: string,
  ): string {
    // Простая реализация Digest (MD5).
    // В реальности может потребоваться расширенная логика (qop, nc, cnonce и т.д.)
    // Для упрощённого примера:
    const realm = auth.realm || '';
    const nonce = auth.nonce || '';
    const uri = path;

    // HA1 = MD5(username:realm:password)
    const HA1 = this.md5(`${username}:${realm}:${password}`);
    // HA2 = MD5(method:uri)
    const HA2 = this.md5(`${method}:${uri}`);
    // response = MD5(HA1:nonce:HA2)
    const response = this.md5(`${HA1}:${nonce}:${HA2}`);

    let header = 'Digest ';
    header += `username="${username}", `;
    header += `realm="${realm}", `;
    header += `nonce="${nonce}", `;
    header += `uri="${uri}", `;
    header += `response="${response}"`;
    // При необходимости дополните qop, nc, cnonce, opaque...

    return header;
  }

  private md5(str: string): string {
    // Можно использовать из crypto:
    // import { createHash } from 'crypto';
    // return createHash('md5').update(str).digest('hex');
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * makeDigestRequest:
   *  - 1) Пытаемся без авторизации,
   *  - 2) Если получаем 401 + www-authenticate, делаем повтор с Digest.
   */
  public async makeDigestRequest(
    host: string,
    path: string,
    method: string,
    username: string,
    password: string,
    postData?: any,
    useHttps = false,
  ): Promise<any[]> {
    try {
      const result = await this.requestOnce(
        host,
        path,
        method,
        {},
        postData,
        useHttps,
      );
      // result уже массив Product[]
      return result;
    } catch (error: any) {
      // Если 401, парсим заголовок и делаем повторный запрос
      if (error.statusCode === 401) {
        const wwwAuthenticate = error.headers?.['www-authenticate'];
        if (!wwwAuthenticate) {
          throw new HttpException('Digest auth header not found', 401);
        }
        const authValues = this.parseAuthenticateHeader(wwwAuthenticate);
        const digestHeader = this.createDigestHeader(
          authValues,
          method,
          path,
          username,
          password,
        );

        this.logger.debug(`Retrying with Digest Auth...`);
        const secondResult = await this.requestOnce(
          host,
          path,
          method,
          { Authorization: digestHeader },
          postData,
          useHttps,
        );
        return secondResult;
      } else {
        // Иная ошибка
        throw error;
      }
    }
  }

  // Делает один запрос (без авторизации / с авторизацией) + парсит XML в массив Product
  private requestOnce(
    host: string,
    path: string,
    method: string,
    headers: Record<string, string> = {},
    postData?: any,
    useHttps = false,
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const options: RequestOptions = {
        host,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const reqFn = useHttps ? httpsRequest : request;
      const req = reqFn(options, (res: IncomingMessage) => {
        const { statusCode } = res;
        let rawData = '';

        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          if (statusCode >= 200 && statusCode < 300) {
            // Парсим XML => массив Product
            try {
              const products = this.parseOnixXml(rawData);
              resolve(products);
            } catch (err) {
              reject(err);
            }
          } else if (statusCode === 401) {
            reject({
              message: 'Unauthorized',
              statusCode: 401,
              headers: res.headers,
              body: rawData,
            });
          } else {
            reject({
              message: `Request failed with code ${statusCode}`,
              statusCode,
              headers: res.headers,
              body: rawData,
            });
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`Request error: ${err.message}`, err.stack);
        reject(err);
      });

      if (postData) {
        const jsonStr = JSON.stringify(postData);
        req.write(jsonStr);
      }
      req.end();
    });
  }

  // Парсит ONIX (XML) => извлекает Product[] из ONIXMessage
  private parseOnixXml(xmlString: string): any[] {
    if (!xmlString || xmlString.trim() === '') {
      return [];
    }
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      // Можете настроить другие опции
    });
    const jsonResult = parser.parse(xmlString);
    const onixMessage = jsonResult?.ONIXMessage;
    if (!onixMessage) {
      this.logger.warn(`No <ONIXMessage> in response.`);
      return [];
    }

    let products = onixMessage.Product;
    if (!products) {
      this.logger.warn(`No <Product> in <ONIXMessage>.`);
      return [];
    }
    if (!Array.isArray(products)) {
      products = [products];
    }
    return products;
  }
}
