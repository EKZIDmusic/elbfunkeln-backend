import { Injectable } from '@nestjs/common';

@Injectable()
export class TaxService {
  getTaxRates() {
    return {
      standard: 0.19, // 19% MwSt
      reduced: 0.07, // 7% MwSt
    };
  }

  calculateTax(calculateDto: any) {
    const { amount, rate = 0.19 } = calculateDto;
    const tax = amount * rate;
    return {
      amount,
      taxRate: rate,
      taxAmount: tax,
      totalWithTax: amount + tax,
    };
  }

  async generateInvoice(id: string) {
    // TODO: Implement invoice generation
    return { invoiceUrl: 'https://example.com/invoice.pdf' };
  }
}
