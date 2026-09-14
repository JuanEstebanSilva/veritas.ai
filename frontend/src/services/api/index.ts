// Barrel — re-exporta todos los módulos de API
// Los imports existentes desde '../services/api' siguen funcionando
export { authApi } from './auth.api';
export { analysisApi } from './analysis.api';
export { writingApi } from './writing.api';
export { paymentApi } from './payment.api';
export { adminApi } from './admin.api';
export { request } from './client';
export type { ApiResponse } from './client';
