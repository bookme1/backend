import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DecodedQueryParamValidationPipe
  implements PipeTransform<string, string>
{
  transform(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      throw new BadRequestException('Invalid encoded value');
    }
  }
}
