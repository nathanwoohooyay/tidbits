import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {

  transform(phone: string | null): string {
    if (!phone) {
      return '';
    }

    const digits = phone.replace(/\D/g, '');

    return digits.length === 10
      ? digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
      : phone;
  }
}