
export enum OrderStatus {
  NEW = 'NEW',
  RECEIVED = 'RECEIVED',
  NOTIFIED = 'NOTIFIED',
  PAID = 'PAID', // Financial status, usually implies previous steps done
  PICKED_UP = 'PICKED_UP', // Final status
  DEBT = 'DEBT' // Special financial status
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  engineSize: string;
}

export interface Customer {
  id: string;
  name: string; // FIO
  phone: string;
  birthDate?: string; // YYYY-MM-DD
  discountPercent: number;
  vehicles: Vehicle[]; // Array of vehicles
}

export interface Product {
  id: string;
  code: string; // Article/Part Number
  brand?: string; // Brand/Manufacturer
  name: string; // Nomenclature
  buyPrice: number;
  sellPrice: number;
}

export interface OrderItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerSnapshot: Customer; // Keep a copy
  vehicleSnapshot: Vehicle; // Specific vehicle for this order
  items: OrderItem[];
  status: OrderStatus;
  date: string; // ISO String
  totalAmount: number;
  prepayment: number; // New: Prepayment amount
  expenses: number; // New: Associated expenses (delivery, etc)
  paymentMethod: PaymentMethod; // New: Method of payment
  totalProfit: number;
  notes?: string;
}

export const MARKUP_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];