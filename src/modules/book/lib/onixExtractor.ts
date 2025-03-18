import { LogsService } from 'src/modules/log/log.service';
import { readText } from '../helper';

interface IBook {
  referenceNumber: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  pages: number;
  lang: string;
  desc: string;
  pub: string;
  pubDate: string;
  url: string;
  formatMobi: string;
  formatPdf: string;
  formatEpub: string;
}

export class BookExtractor {
  constructor(private logsService: LogsService) {}

  async extractBookData(serviceBookObject: any, index: number) {
    const missingFields: string[] = [];

    const recordReference = this.extractRecordReference(
      serviceBookObject,
      index,
    );

    if (!recordReference) return null;

    const descriptiveDetail = serviceBookObject?.DescriptiveDetail || {};
    const publishingDetail = serviceBookObject?.PublishingDetail || {};
    const collateralDetail = serviceBookObject?.CollateralDetail || {};
    const productSupply = serviceBookObject?.ProductSupply || {};

    const isAvailable =
      productSupply?.SupplyDetail?.ProductAvailability?._text === '20';

    if (!isAvailable) {
      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Book ${recordReference} is not available for purchase`,
        context: JSON.stringify(serviceBookObject, null, 2),
        code: 3010,
      });
      return null;
    }

    const formats = this.extractFormats(serviceBookObject?.ProductionDetail);

    try {
      const bookData: IBook = {
        referenceNumber: recordReference,
        title: await this.extractAndLog(
          descriptiveDetail,
          'TitleDetail',
          this.extractTitle,
          missingFields,
        ),
        author: await this.extractAndLog(
          descriptiveDetail,
          'Contributor',
          this.extractAuthors.bind(this),
          missingFields,
          true,
        ), // ОБЯЗАТЕЛЬНО
        genre: await this.extractAndLog(
          descriptiveDetail,
          'Subject',
          this.extractGenres.bind(this),
          missingFields,
          true,
        ), // ОБЯЗАТЕЛЬНО
        price: await this.extractAndLog(
          productSupply,
          'SupplyDetail',
          this.extractPrice,
          missingFields,
        ),
        pages: await this.extractAndLog(
          descriptiveDetail,
          'Extent',
          this.extractPageCount,
          missingFields,
          true,
        ), // ОБЯЗАТЕЛЬНО
        lang: await this.extractAndLog(
          descriptiveDetail,
          'Language',
          this.extractLanguage,
          missingFields,
        ),
        desc: await this.extractAndLog(
          collateralDetail,
          'TextContent',
          this.extractDescription,
          missingFields,
          true,
        ), // ОБЯЗАТЕЛЬНО
        pub: await this.extractAndLog(
          publishingDetail,
          'Publisher',
          this.extractPublisher,
          missingFields,
          true,
        ), // ОБЯЗАТЕЛЬНО
        pubDate: await this.extractAndLog(
          publishingDetail,
          'PublishingDate',
          this.extractPublicationDate,
          missingFields,
        ),
        // format: await this.extractAndLog(
        //   descriptiveDetail,
        //   'ProductForm',
        //   this.extractFormat,
        //   missingFields,
        // ),
        url: this.extractCoverUrl(collateralDetail),
        formatMobi: formats.formatMobi,
        formatPdf: formats.formatPdf,
        formatEpub: formats.formatEpub,
      };

      return bookData;
    } catch (error) {
      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Book ${recordReference} is missing required fields: ${missingFields.join(', ')}`,
        context: JSON.stringify(serviceBookObject, null, 2),
        code: 3011,
      });

      return null;
    }
  }

  private async extractAndLog<T>(
    source: any,
    field: string,
    extractor: (data: any) => T | Promise<T>,
    missingFields: string[],
    required: boolean = false,
  ): Promise<T> {
    const data = source?.[field];

    if (!data) {
      missingFields.push(field);
      if (required) {
        throw new Error(`Missing required field: ${field}`);
      }
      return await extractor(null);
    }

    return await extractor(data);
  }

  private extractRecordReference(
    serviceBookObject: any,
    index: number,
  ): string | null {
    try {
      if (!serviceBookObject || !serviceBookObject.RecordReference) {
        this.logsService.save({
          source: 'updateBooksFromArthouse',
          message: `Missing RecordReference for book index ${index}`,
          context: JSON.stringify(serviceBookObject, null, 2),
          code: 1002,
        });
        return null;
      }

      const recordReference = serviceBookObject.RecordReference._text?.trim();

      if (!recordReference) {
        this.logsService.save({
          source: 'updateBooksFromArthouse',
          message: `Empty RecordReference for book index ${index}`,
          context: JSON.stringify(serviceBookObject, null, 2),
          code: 1003,
        });
        return null;
      }

      return recordReference;
    } catch (error) {
      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Error extracting RecordReference for book index ${index}: ${error.message}`,
        context: JSON.stringify(serviceBookObject, null, 2),
        code: 1004,
      });
      return null;
    }
  }

  private async extractAuthors(contributors: any): Promise<string> {
    if (!contributors) return 'Без автора';

    if (!Array.isArray(contributors)) contributors = [contributors];

    // Фильтруем только авторов (A01)
    const authors = contributors
      .filter((c) => c?.ContributorRole?._text === 'A01')
      .map((c) => c.PersonName?._text || 'Невідомий автор');

    return authors.length > 0 ? authors.join(', ') : 'Без автора';
  }

  private async extractGenres(subjects: any): Promise<string> {
    if (!subjects) return 'Жанр невідомий';

    if (!Array.isArray(subjects)) subjects = [subjects];

    const genres = subjects
      .map((s) => s.SubjectHeadingText?._text)
      .filter((g) => g);

    return genres.length > 0 ? genres.join(', ') : 'Жанр невідомий';
  }

  private extractTitle(titleDetails: any): string {
    if (!titleDetails) return 'Без назви';

    if (!Array.isArray(titleDetails)) titleDetails = [titleDetails];

    for (const titleDetail of titleDetails) {
      const titleElements = Array.isArray(titleDetail?.TitleElement)
        ? titleDetail.TitleElement
        : [titleDetail?.TitleElement];

      for (const titleElement of titleElements) {
        const title = titleElement?.TitleText?._text;
        if (title) return title;
      }
    }
    return 'Без назви';
  }

  private extractPrice(supplyDetail: any): number {
    return Number(supplyDetail?.Price?.PriceAmount?._text) || 0;
  }

  private extractFormats(productionDetail: any): {
    formatMobi: string;
    formatPdf: string;
    formatEpub: string;
  } {
    if (!productionDetail?.ProductionManifest?.BodyManifest?.BodyResource) {
      return { formatMobi: '', formatPdf: '', formatEpub: '' };
    }

    const resources = Array.isArray(
      productionDetail.ProductionManifest.BodyManifest.BodyResource,
    )
      ? productionDetail.ProductionManifest.BodyManifest.BodyResource
      : [productionDetail.ProductionManifest.BodyManifest.BodyResource];

    let formatMobi = '';
    let formatPdf = '';
    let formatEpub = '';

    for (const resource of resources) {
      const fileLink = resource?.ResourceFileLink?._text;
      if (!fileLink) continue;

      if (fileLink.endsWith('.mobi')) {
        formatMobi = fileLink;
      } else if (fileLink.endsWith('.pdf')) {
        formatPdf = fileLink;
      } else if (fileLink.endsWith('.epub')) {
        formatEpub = fileLink;
      }
    }

    return { formatMobi, formatPdf, formatEpub };
  }

  private extractPageCount(extents: any): number {
    if (!extents) return 0;

    if (!Array.isArray(extents)) extents = [extents];

    const pages = extents.find((e) => e.ExtentType?._text === '00')?.ExtentValue
      ?._text;

    return pages ? Number(pages) : 0;
  }

  private extractLanguage(languages: any): string {
    if (!languages) return 'Немає інформації';

    if (!Array.isArray(languages)) languages = [languages];

    const mainLanguage = languages.find(
      (lang) => lang.LanguageRole?._text === '01',
    );

    return mainLanguage?.LanguageCode?._text?.trim() || 'Немає інформації';
  }

  private extractDescription(textContents: any): string {
    if (!textContents) return 'Без опису';

    if (!Array.isArray(textContents)) textContents = [textContents];

    for (const textContent of textContents) {
      const text = textContent?.Text?._cdata || textContent?.Text?._text;
      if (text) return text;
    }

    return 'Без опису';
  }

  private extractPublisher(publishingDetail: any): string {
    if (!publishingDetail) {
      return 'Видавництво невідоме';
    }

    return readText(publishingDetail?.PublisherName);
  }

  private extractPublicationDate(publishingDate: any): string {
    return publishingDate?.Date?._text || '';
  }

  private extractEdition(edition: any): string {
    return edition?._text || 'Невідомо';
  }

  private extractFormat(format: any): string {
    return format?._text || 'Невідомо';
  }

  private extractCoverUrl(collateralDetail: any): string {
    if (!collateralDetail?.SupportingResource) return '';

    const resources = Array.isArray(collateralDetail.SupportingResource)
      ? collateralDetail.SupportingResource
      : [collateralDetail.SupportingResource];

    for (const resource of resources) {
      const versions = Array.isArray(resource?.ResourceVersion)
        ? resource.ResourceVersion
        : [resource?.ResourceVersion];

      for (const version of versions) {
        const url = version?.ResourceLink?._text;
        if (url) return url;
      }
    }

    return '';
  }

  private extractISBN(identifiers: any): string {
    if (!identifiers) return 'Невідомо';

    if (!Array.isArray(identifiers)) identifiers = [identifiers];

    return (
      identifiers.find((id) => id.ProductIDType?._text === '15')?.IDValue
        ?._text || 'Невідомо'
    );
  }

  private extractDimensions(measures: any): string {
    if (!measures) return 'Невідомо';

    if (!Array.isArray(measures)) measures = [measures];

    const width = measures.find((m) => m.MeasureType?._text === '01')
      ?.MeasureValue?._text;
    const height = measures.find((m) => m.MeasureType?._text === '02')
      ?.MeasureValue?._text;
    const thickness = measures.find((m) => m.MeasureType?._text === '08')
      ?.MeasureValue?._text;

    return `Width: ${width || '?'}, Height: ${height || '?'}, Thickness: ${thickness || '?'}`;
  }

  private extractAvailability(status: any): string {
    return status?._text || 'Невідомо';
  }
}
