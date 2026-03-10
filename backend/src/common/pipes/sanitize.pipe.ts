import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }
    return value;
  }

  private sanitizeString(str: string): string {
    return sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === 'string') {
        obj[key] = this.sanitizeString(val);
      } else if (typeof val === 'object' && val !== null) {
        obj[key] = this.sanitizeObject(val as Record<string, unknown>);
      }
    }
    return obj;
  }
}
