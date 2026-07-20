import type { ApiClientMethods } from './api-client.types';

export function injectTaxes(api: ApiClientMethods) {
  api.getCountryTaxes = function () {
    return this.get('/taxes/countries');
  };
  api.getCountryTax = function (countryCode: string) {
    return this.get('/taxes/countries/' + countryCode);
  };
  api.createCountryTax = function (data: any) {
    return this.post('/taxes/countries', data);
  };
  api.updateCountryTax = function (countryCode: string, data: any) {
    return this.put('/taxes/countries/' + countryCode, data);
  };
  api.getBusinessTaxConfig = function () {
    return this.get('/taxes/business');
  };
  api.updateBusinessTaxConfig = function (data: any) {
    return this.put('/taxes/business', data);
  };
  api.getTaxReports = function () {
    return this.get('/taxes/reports');
  };
  api.generateTaxReport = function (data: any) {
    return this.post('/taxes/reports', data);
  };
}
