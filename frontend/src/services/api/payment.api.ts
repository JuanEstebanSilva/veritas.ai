import { request } from './client';

export const paymentApi = {
  createCheckout: () =>
    request<{ success: boolean; provider: string; checkoutUrl?: string }>(
      '/payments/create-checkout-session',
      { method: 'POST' }
    ),

  initSandbox: () =>
    request<{
      success: boolean;
      transaction: { transactionId: string; amount: number };
      testInstructions: any;
    }>('/payments/sandbox-init', { method: 'POST' }),

  confirmSandbox: (transactionId: string, simulateSuccess: boolean) =>
    request<{ success: boolean; message: string; isPremium: boolean }>(
      '/payments/sandbox-confirm',
      {
        method: 'POST',
        body: JSON.stringify({ transactionId, simulateSuccess }),
      }
    ),

  getHistory: () =>
    request<{ success: boolean; payments: any[] }>('/payments/history'),
};
