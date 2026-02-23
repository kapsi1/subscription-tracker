import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private sanitizeString(str: string): string {
    // Simple sanitization to prevent basic XSS or unwanted tags
    // For a more robust solution, use a library like dompurify or sanitize-html
    return str.replace(/<[^>]*>?/gm, '');
  }

  private sanitizeObject(obj: any): any {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = this.sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = this.sanitizeObject(obj[key]);
      }
    }
    return obj;
  }
}
