/**
 * Data Layer — Barrel file
 *
 * Pure database operations, no business logic, no events.
 * Ready to be imported by services: import { listProductsByBusiness } from '../data';
 *
 * ⚠️ Currently these files are prepared as a pattern but NOT yet imported
 *    by the services (which still contain their own DB queries).
 *    To activate: update the service to import from '../data' instead.
 */

export * from './product';
export * from './orders';
export * from './debts';
