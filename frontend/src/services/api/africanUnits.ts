import type { ApiClientMethods } from './api-client.types';

export function injectAfricanUnits(api: ApiClientMethods) {
  api.getAfricanUnits = function (params?: any) {
    return this.get('/units', { params });
  };
  api.getAfricanUnit = function (id: string) {
    return this.get('/units/' + id);
  };
  api.createAfricanUnit = function (data: any) {
    return this.post('/units', data);
  };
  api.updateAfricanUnit = function (id: string, data: any) {
    return this.put('/units/' + id, data);
  };
  api.deleteAfricanUnit = function (id: string) {
    return this.delete('/units/' + id);
  };
  api.convertAfricanUnit = function (unitId: string, value: number, toStandard?: boolean) {
    return this.post('/units/convert', { unitId, value, toStandard });
  };
  api.getAfricanUnitCategories = function () {
    return this.get('/units/categories');
  };
}
