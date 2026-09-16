import React from 'react';
import { ToastProvider } from './Toast';
import { ConfirmProvider } from './ConfirmDialog';

export { ErrorBoundary } from './ErrorBoundary';
export { Dialog } from './Dialog';
export { ToastProvider, useToast } from './Toast';
export type { ToastOptions, ToastTone } from './Toast';
export { ConfirmProvider, useConfirm } from './ConfirmDialog';
export type { ConfirmOptions } from './ConfirmDialog';
export { Skeleton, SkeletonRows } from './Skeleton';

/** Avisos y confirmaciones de toda la aplicación. */
export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(ToastProvider, null, React.createElement(ConfirmProvider, null, children));
