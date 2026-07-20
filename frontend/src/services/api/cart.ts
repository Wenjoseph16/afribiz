import type { ApiClientMethods } from './api-client.types';

export function injectCart(api: ApiClientMethods) {
  api.getCart = function () {
    return this.get('/cart');
  };
  api.addToCart = function (data: {
    productId?: string;
    variantId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
    notes?: string;
  }) {
    return this.post('/cart/items', data);
  };
  api.updateCartItem = function (itemId: string, data: { quantity: number; notes?: string }) {
    return this.put(`/cart/items/${itemId}`, data);
  };
  api.removeFromCart = function (itemId: string) {
    return this.delete(`/cart/items/${itemId}`);
  };
  api.clearCart = function () {
    return this.delete('/cart');
  };
  api.applyCoupon = function (code: string) {
    return this.post('/cart/coupon', { code });
  };
  api.removeCoupon = function () {
    return this.delete('/cart/coupon');
  };
  api.guestCheckout = function (data: {
    email: string;
    contactName: string;
    contactPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    paymentMethod?: string;
    items: Array<{
      productId?: string;
      serviceId?: string;
      name: string;
      quantity: number;
      unitPrice: number;
      image?: string;
    }>;
  }) {
    return this.post('/cart/guest-checkout', data);
  };
  api.checkout = function (data: {
    type?: string;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    contactPhone?: string;
    contactName?: string;
    notes?: string;
    paymentMethod?: string;
  }) {
    return this.post('/cart/checkout', data);
  };
}
