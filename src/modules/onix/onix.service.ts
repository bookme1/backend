import { HttpException, Injectable, Logger } from '@nestjs/common';
import crypto, { createHash, randomBytes } from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { request, RequestOptions, IncomingMessage } from 'http';
import { request as httpsRequest } from 'https';
import { readText, toArray } from '../book/helper';

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

  private md5(str: string): string {
    // Можно использовать из crypto:
    // import { createHash } from 'crypto';
    // return createHash('md5').update(str).digest('hex');
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Основная точка входа:
   * 1) Делает запрос без Authorization
   * 2) Если 401 и есть заголовок WWW-Authenticate -> генерируем Digest
   * 3) Повторяем запрос
   * 4) При 301/302 -> обрабатываем Location (редирект)
   */
  public async makeDigestRequest(
    host: string,
    path: string,
    method: string,
    username: string,
    password: string,
    postData?: any,
    useHttps = false,
    maxRedirects = 5, // чтобы не зацикливаться
  ): Promise<any[]> {
    let currentHost = host;
    let currentPath = path;
    let currentUseHttps = useHttps;
    let attempts = 0;

    while (attempts < maxRedirects) {
      attempts++;
      try {
        // 1. Попытка без заголовка
        const result = await this.requestOnce(
          currentHost,
          currentPath,
          method,
          {},
          postData,
          currentUseHttps,
        );
        return result; // если успех => возвращаем
      } catch (error: any) {
        // Если 401 + WWW-Authenticate => делаем повторный запрос с Digest
        if (error.statusCode === 401) {
          const wwwAuth = error.headers?.['www-authenticate'];
          if (!wwwAuth) {
            throw new HttpException('No WWW-Authenticate header', 401);
          }
          // Генерируем Authorization
          const digestHeader = this.createDigestHeader(
            wwwAuth,
            method,
            currentPath,
            username,
            password,
          );
          // 2. Повтор
          try {
            const result = await this.requestOnce(
              currentHost,
              currentPath,
              method,
              { Authorization: digestHeader },
              postData,
              currentUseHttps,
            );
            return result; // успех
          } catch (err2: any) {
            // Может быть редирект / др. ошибка
            if (this.isRedirect(err2.statusCode)) {
              // Читаем Location
              const newLocation = err2.headers?.location;
              if (!newLocation) {
                throw new Error(
                  `Redirect ${err2.statusCode} but no Location header`,
                );
              }
              const {
                host: newHost,
                path: newPath,
                isHttps,
              } = this.parseLocation(newLocation, currentUseHttps);
              currentHost = newHost;
              currentPath = newPath;
              currentUseHttps = isHttps;
              continue; // идём на новый цикл
            } else {
              throw err2;
            }
          }
        } else if (this.isRedirect(error.statusCode)) {
          // 301, 302, 307, 308
          const newLocation = error.headers?.location;
          if (!newLocation) {
            throw new Error(
              `Redirect ${error.statusCode} but no Location header`,
            );
          }
          const {
            host: newHost,
            path: newPath,
            isHttps,
          } = this.parseLocation(newLocation, currentUseHttps);
          currentHost = newHost;
          currentPath = newPath;
          currentUseHttps = isHttps;
          continue; // следующий цикл
        } else {
          // Любая другая ошибка
          throw error;
        }
      }
    }

    throw new Error(`Too many redirects (${maxRedirects})`);
  }

  // Делает одиночный запрос (без/с заголовком), парсит результат
  private requestOnce(
    host: string,
    path: string,
    method: string,
    headers: Record<string, string> = {},
    postData?: any,
    useHttps = false,
  ): Promise<any[]> {
    const reqFn = useHttps ? httpsRequest : request;

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

      const req = reqFn(options, (res: IncomingMessage) => {
        const { statusCode } = res;
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          if (statusCode >= 200 && statusCode < 300) {
            // Парсим XML -> массив продуктов
            try {
              const products = this.parseOnixXml(rawData);
              resolve(products);
            } catch (parseErr) {
              reject(parseErr);
            }
          } else {
            // Всё, что не 2xx => rejet
            reject({
              statusCode,
              headers: res.headers,
              body: rawData,
            });
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`Request error => ${err.message}`, err.stack);
        reject(err);
      });

      if (postData) {
        const bodyStr = JSON.stringify(postData);
        req.write(bodyStr);
      }
      req.end();
    });
  }

  // Обрабатываем WWW-Authenticate (Digest) + формируем заголовок Authorization
  private createDigestHeader(
    wwwAuth: string,
    method: string,
    uri: string,
    username: string,
    password: string,
  ): string {
    // Пример: WWW-Authenticate: Digest realm="...", qop="auth", nonce="...", opaque="..."
    // Парсим
    const authObj = this.parseDigestHeader(wwwAuth);
    const realm = authObj.realm;
    const nonce = authObj.nonce;
    const opaque = authObj.opaque;
    const algorithm = authObj.algorithm || 'MD5';
    let qop = authObj.qop || 'auth'; // обычно "auth"

    // Для qop=auth нам нужны nc, cnonce
    const nc = '00000001';
    const cnonce = randomBytes(8).toString('hex'); // любое случайное

    // MD5 helper
    const md5 = (data: string) => createHash('md5').update(data).digest('hex');

    // HA1
    const HA1 = md5(`${username}:${realm}:${password}`);
    // HA2
    const HA2 = md5(`${method}:${uri}`);
    // response
    const response = md5(`${HA1}:${nonce}:${nc}:${cnonce}:${qop}:${HA2}`);

    let header = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", `;
    header += `qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;

    if (opaque) {
      header += `, opaque="${opaque}"`;
    }
    // если algorithm=MD5-sess, потребуется другая формула HA1
    // но чаще MD5

    return header;
  }

  // Разбирает строку WWW-Authenticate
  private parseDigestHeader(header: string): Record<string, string> {
    // Пример: Digest realm="...", qop="auth", nonce="...", opaque="..."
    // Убираем "Digest "
    const s = header.replace(/^Digest\s+/i, '').trim();
    // Делим по запятым
    const parts = s.split(',');
    const map: Record<string, string> = {};
    for (let p of parts) {
      p = p.trim();
      const eqPos = p.indexOf('=');
      if (eqPos > 0) {
        const key = p.substring(0, eqPos).trim();
        let val = p.substring(eqPos + 1).trim();
        val = val.replace(/^"(.*)"$/, '$1'); // убираем кавычки
        map[key] = val;
      }
    }
    return map;
  }

  private isRedirect(code: number) {
    return code === 301 || code === 302 || code === 307 || code === 308;
  }

  // Разбираем location => { host, path, isHttps }
  private parseLocation(
    location: string,
    currentHttps: boolean,
  ): {
    host: string;
    path: string;
    isHttps: boolean;
  } {
    // location может быть абсолютным URL (https://.../path) или относительным (/new-path)
    // Простой способ:
    let isHttps = currentHttps;
    if (/^https?:\/\//i.test(location)) {
      // Абсолютная ссылка
      const url = new URL(location);
      return {
        host: url.hostname,
        path: url.pathname + (url.search || ''),
        isHttps: url.protocol === 'https:',
      };
    } else {
      // Относительный путь
      // Предполагаем, что хост не меняется, только путь
      return {
        host: '',
        path: location,
        isHttps: isHttps,
      };
    }
  }

  // Парсим XML -> JS -> вытаскиваем Product[]
  private parseOnixXml(xmlString: string): any[] {
    if (!xmlString || xmlString.trim() === '') return [];
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const jsObj = parser.parse(xmlString);
    const onixMessage = jsObj?.ONIXMessage;
    if (!onixMessage) {
      return [];
    }
    let products = onixMessage.Product;
    if (!products) return [];
    if (!Array.isArray(products)) products = [products];
    return products;
  }

  /**
   * Пытаемся аккуратно разобрать ONIX 3.0 Product в наш объект книги.
   * Обратите внимание, что это "базовый" пример. Подстраивайте под свои нужды.
   */
  public parseOnixProduct(product: any) {
    // 1) RecordReference
    const recordReference = product?.RecordReference
      ? String(product.RecordReference)
      : '';

    // 2) Извлечём title (DescriptiveDetail -> TitleDetail).
    // Часто нужен вариант TitleType=1 в TitleDetail[...].
    // Если не находим, берём просто первый
    let title = 'Без назви';
    const dd = product?.DescriptiveDetail;
    if (dd?.TitleDetail) {
      const titleDetails = toArray(dd.TitleDetail);
      // Сначала ищем TitleType=1
      const mainTitleObj =
        titleDetails.find((td) => td.TitleType == 1) || titleDetails[0];
      if (mainTitleObj?.TitleElement) {
        // Бывает TitleElement — массив, бывает объект
        const titleElems = toArray(mainTitleObj.TitleElement);
        const firstElem = titleElems[0];
        if (firstElem?.TitleText) {
          // В нашем JSON пример:  "TitleText": { "#text": "Needful Things", "language": "ukr" }
          title = readText(firstElem.TitleText, 'Без назви');
        }
      }
    }

    // 3) Автор(ы). Обычно ContributorRole="A01" — автор
    let authors: string[] = [];
    if (dd?.Contributor) {
      const contributors = toArray(dd.Contributor);
      // Фильтруем только тех, у кого ContributorRole = 'A01'
      const authorContribs = contributors.filter(
        (c) => c.ContributorRole === 'A01',
      );
      if (authorContribs.length > 0) {
        authors = authorContribs.map((c) =>
          typeof c.PersonName === 'string'
            ? c.PersonName
            : String(c.PersonName),
        );
        // Если PersonName — объект с "#text", тогда:
        authors = authorContribs.map((c) =>
          readText(c.PersonName, 'Без автора'),
        );
      }
    }
    if (authors.length === 0) {
      authors.push('Без автора');
    }
    const author = authors.join(', ');

    // 4) pages (DescriptiveDetail -> Extent -> ExtentValue)
    let pages = 0;
    if (dd?.Extent) {
      const extents = toArray(dd.Extent);
      // Ищем ExtentType=0 (Pages) или первый
      const pageExtent = extents.find((e) => e.ExtentType == 0) || extents[0];
      if (pageExtent?.ExtentValue !== undefined) {
        pages = Number(pageExtent.ExtentValue);
      }
    }

    // 5) lang (DescriptiveDetail -> Language -> LanguageCode)
    let lang = 'Немає інформації';
    if (dd?.Language) {
      // Language может быть массивом
      const langs = toArray(dd.Language);
      if (langs.length > 0 && langs[0].LanguageCode) {
        lang = String(langs[0].LanguageCode); // например, "ukr"
      }
    }

    // 6) genre (DescriptiveDetail -> Subject -> SubjectHeadingText)
    let genre = 'Жанр невідомий';
    if (dd?.Subject) {
      const subjects = toArray(dd.Subject);
      if (subjects.length > 0 && subjects[0].SubjectHeadingText) {
        //  "SubjectHeadingText": { "#text": "..." }
        genre = readText(subjects[0].SubjectHeadingText, 'Жанр невідомий');
      }
    }

    // 7) Описание (CollateralDetail -> TextContent -> Text -> "#text")
    let desc = 'Без опису';
    const cd = product?.CollateralDetail;
    if (cd?.TextContent) {
      // TextContent бывает массивом или объектом
      const textContents = toArray(cd.TextContent);
      if (textContents.length > 0 && textContents[0]?.Text) {
        desc = readText(textContents[0].Text, 'Без опису');
      }
    }

    // 8) Обложка (CollateralDetail -> SupportingResource)
    // Обычно ResourceContentType=1 => обложка
    let url = '';
    if (cd?.SupportingResource) {
      const resources = toArray(cd.SupportingResource);
      const cover = resources.find((r) => r.ResourceContentType == 1);
      if (cover?.ResourceVersion) {
        const rvArray = toArray(cover.ResourceVersion);
        if (rvArray.length > 0) {
          url = rvArray[0].ResourceLink || '';
          // Бывает: "ResourceLink": "https://..."
        }
      }
    }

    // 9) Цена (ProductSupply -> SupplyDetail -> Price -> PriceAmount)
    let price = '0';
    if (
      product?.ProductSupply?.SupplyDetail?.Price?.PriceAmount !== undefined
    ) {
      price = String(product.ProductSupply.SupplyDetail.Price.PriceAmount);
    }

    // 10) Издатель + дата (PublishingDetail)
    let pub = 'Автор невідомий';
    let pubDate = 'Немає інформації';
    const pd = product?.PublishingDetail;
    if (pd?.Publisher?.PublisherName) {
      pub = String(pd.Publisher.PublisherName);
    }
    if (pd?.PublishingDate) {
      const pubDates = toArray(pd.PublishingDate);
      // Ищем role=1 (PublicationDate) или берём первую
      const mainDate =
        pubDates.find((d) => d.PublishingDateRole == 1) || pubDates[0];
      if (mainDate?.Date?.['#text']) {
        pubDate = String(mainDate.Date['#text']); // может быть "20210701"
      } else if (mainDate?.Date) {
        // Если дата просто число
        pubDate = String(mainDate.Date);
      }
    }

    // 11) Определяем форматы: mobi, epub, pdf (ProductionDetail -> ProductionManifest -> BodyManifest -> BodyResource)
    let formatMobi = '';
    let formatEpub = '';
    let formatPdf = '';
    const prod = product?.ProductionDetail?.ProductionManifest?.BodyManifest;
    if (prod?.BodyResource) {
      const bodyResources = toArray(prod.BodyResource);
      for (const br of bodyResources) {
        const link = br.ResourceFileLink;
        if (!link) continue;
        // Простейшая логика: если в названии файла .mobi => это формат mobi
        const lower = link.toLowerCase();
        if (lower.endsWith('.mobi')) {
          formatMobi = link;
        } else if (lower.endsWith('.epub')) {
          formatEpub = link;
        } else if (lower.endsWith('.pdf')) {
          formatPdf = link;
        }
      }
    }

    // Собираем итоговый объект
    return {
      referenceNumber: recordReference,
      art: '',
      title,
      url,
      price,
      pages,
      lang,
      desc,
      author,
      pub,
      pubDate,
      genre,
      formatMobi,
      formatEpub,
      formatPdf,
    };
  }
}
