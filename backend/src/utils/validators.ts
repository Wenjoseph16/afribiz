/**
 * Validation utilities
 */

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  return /^[+]?[\d\s\-()]{10,}$/.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export const isEmpty = (value: any): boolean => {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (Object.keys(value).length === 0 && value.constructor === Object)
  );
};

export const validateArray = <T>(
  arr: unknown,
  validator: (item: any) => item is T
): arr is T[] => {
  return Array.isArray(arr) && arr.every(validator);
};
