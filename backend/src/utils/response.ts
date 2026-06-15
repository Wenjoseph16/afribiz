// API Response formatter
export const successResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  data,
  message,
});

export const errorResponse = (error: string, statusCode = 500) => ({
  success: false,
  error,
  statusCode,
});

// Pagination helper
export const getPaginationParams = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};
