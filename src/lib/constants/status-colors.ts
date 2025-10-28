// src/lib/constants/status-colors.ts

import { 
  EnrollmentStatus, 
  InstallmentStatus, 
  PaymentStatus 
} from '@/lib/types/payment.types';

/**
 * Couleurs et variants pour les badges de statut
 */
export const statusColors = {
  // Statuts des versements
  [InstallmentStatus.PAID]: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700",
  [InstallmentStatus.UNPAID]: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700",
  [InstallmentStatus.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  [InstallmentStatus.REFUNDED]: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  
  // Statuts des demandes
  [EnrollmentStatus.APPROVED]: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  [EnrollmentStatus.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  [EnrollmentStatus.REJECTED]: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

/**
 * Variants pour les badges selon le statut
 */
export const statusVariants = {
  [EnrollmentStatus.APPROVED]: "default" as const,
  [EnrollmentStatus.PENDING]: "secondary" as const,
  [EnrollmentStatus.REJECTED]: "destructive" as const,
};

/**
 * Icônes pour les statuts
 */
export const statusIcons = {
  [EnrollmentStatus.APPROVED]: "CheckCircle",
  [EnrollmentStatus.PENDING]: "Hourglass", 
  [EnrollmentStatus.REJECTED]: "XCircle",
  [InstallmentStatus.PAID]: "CheckCircle",
  [InstallmentStatus.UNPAID]: "XCircle",
  [InstallmentStatus.PENDING]: "Clock",
  [InstallmentStatus.REFUNDED]: "RefreshCw",
};