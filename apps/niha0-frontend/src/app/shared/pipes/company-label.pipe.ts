import { Pipe, PipeTransform } from '@angular/core';
import { companyLabel } from '../../core/tenancy/company-label';

@Pipe({ name: 'companyLabel', standalone: true })
export class CompanyLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, fallback = 'Organisation'): string {
    return companyLabel(value, fallback);
  }
}
