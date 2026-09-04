// Shopkeeper Canteen Panel API Gateway Endpoint Resolution
// In production builds (Vite), inject VITE_API_URL via environment variables or .env
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'https://campusbite-api.vercel.app/api/v1';
