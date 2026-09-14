// Re-export of Prisma models and database instance
export { prisma } from '../config/prisma';
export type {
  User,
  Analysis,
  AnalysisResult,
  AnalysisSource,
  Payment,
  Role,
  AnalysisType,
  PaymentStatus,
} from '@prisma/client';
