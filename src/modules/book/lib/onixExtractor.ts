import { LogsService } from 'src/modules/log/log.service';

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

    const bookData = {
      referenceNumber: recordReference,
      title: await this.extractAndLog(
        descriptiveDetail,
        'TitleDetail',
        this.extractTitle,
        missingFields,
      ),
      authors: await this.extractAndLog(
        descriptiveDetail,
        'Contributor',
        this.extractAuthors.bind(this),
        missingFields,
      ),
      genres: await this.extractAndLog(
        descriptiveDetail,
        'Subject',
        this.extractGenres.bind(this),
        missingFields,
      ),
      price: await this.extractAndLog(
        productSupply,
        'SupplyDetail',
        this.extractPrice,
        missingFields,
      ),
      pageCount: await this.extractAndLog(
        descriptiveDetail,
        'Extent',
        this.extractPageCount,
        missingFields,
      ),
      language: await this.extractAndLog(
        descriptiveDetail,
        'Language',
        this.extractLanguage,
        missingFields,
      ),
      description: await this.extractAndLog(
        collateralDetail,
        'TextContent',
        this.extractDescription,
        missingFields,
      ),
      publisher: await this.extractAndLog(
        publishingDetail,
        'Publisher',
        this.extractPublisher,
        missingFields,
      ),
      publicationDate: await this.extractAndLog(
        publishingDetail,
        'PublishingDate',
        this.extractPublicationDate,
        missingFields,
      ),
      // edition: await this.extractAndLog(
      //   descriptiveDetail,
      //   'EditionNumber',
      //   this.extractEdition,
      //   missingFields,
      // ),
      format: await this.extractAndLog(
        descriptiveDetail,
        'ProductForm',
        this.extractFormat,
        missingFields,
      ),
      // isbn: await this.extractAndLog(
      //   descriptiveDetail,
      //   'ProductIdentifier',
      //   this.extractISBN,
      //   missingFields,
      // ),
      // dimensions: await this.extractAndLog(
      //   descriptiveDetail,
      //   'Measure',
      //   this.extractDimensions,
      //   missingFields,
      // ),
      // availability: await this.extractAndLog(
      //   productSupply,
      //   'MarketPublishingStatus',
      //   this.extractAvailability,
      //   missingFields,
      // ),
    };

    // Логируем все отсутствующие поля
    if (missingFields.length > 0) {
      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Missing fields for book index ${index}: ${missingFields.join(', ')}`,
        context: JSON.stringify(serviceBookObject, null, 2),
        code: 3009,
      });
    }

    return bookData;
  }

  private async extractAndLog<T>(
    source: any,
    field: string,
    extractor: (data: any) => T | Promise<T>,
    missingFields: string[],
  ): Promise<T> {
    const data = source?.[field];

    if (!data) {
      missingFields.push(field);
      return await extractor(null); // Передаем null, чтобы обработать заглушки внутри extractor
    }

    return await extractor(data);
  }

  private extractRecordReference(
    serviceBookObject: any,
    index: number,
  ): string | null {
    const recordReference = serviceBookObject?.RecordReference?._text || '';
    if (!recordReference) {
      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Missing RecordReference for book index ${index}`,
        context: JSON.stringify(serviceBookObject, null, 2),
        code: 1002,
      });
      return null;
    }
    return recordReference;
  }

  private async extractAuthors(contributors: any): Promise<string[]> {
    if (!contributors) return [];

    if (!Array.isArray(contributors)) contributors = [contributors];

    // Обрабатываем случаи, когда вообще нет авторов
    if (contributors.some((c) => c.NoContributor)) return ['Автор відсутній'];

    return contributors
      .filter((c) => {
        const role = c?.ContributorRole?._text;
        return role && (role.includes('A01') || role.includes('B06')); // включаем и редакторов
      })
      .map(
        (c) =>
          c.PersonName?._text || c.UnnamedPersons?._text || 'Народна творчість',
      );
  }

  private async extractGenres(subjects: any): Promise<string[]> {
    if (!subjects) return [];

    if (!Array.isArray(subjects)) subjects = [subjects];

    return subjects.map((s) => s.SubjectHeadingText?._text || 'Жанр невідомий');
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

  private extractPageCount(extents: any): number {
    if (!extents) return 0;

    if (!Array.isArray(extents)) extents = [extents];

    return (
      Number(
        extents.find((e) => e.ExtentType?._text === '00')?.ExtentValue?._text,
      ) || 0
    );
  }

  private extractLanguage(languages: any): string {
    return languages?.[0]?.LanguageCode?._text || 'Немає інформації';
  }

  private extractDescription(textContents: any): string {
    return textContents?.[0]?.Text?._cdata || 'Без опису';
  }

  private extractPublisher(publisherData: any): string {
    return publisherData?.PublisherName?._text || 'Автор невідомий';
  }

  private extractPublicationDate(publishingDate: any): string {
    return publishingDate?.Date?._text || 'Невідомо';
  }

  private extractEdition(edition: any): string {
    return edition?._text || 'Невідомо';
  }

  private extractFormat(format: any): string {
    return format?._text || 'Невідомо';
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
