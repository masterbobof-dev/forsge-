import { Customer, Order, Product, Vehicle } from '../types';

const KEYS = {
  CUSTOMERS: 'autoparts_customers',
  PRODUCTS: 'autoparts_products',
  ORDERS: 'autoparts_orders'
};

export const StorageService = {
  getCustomers: (): Customer[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
      // Migration: Convert old flat structure to new nested vehicle structure
      return raw.map((c: any) => {
        if (!c.vehicles) {
          const legacyVehicle: Vehicle = {
            id: crypto.randomUUID(),
            vin: c.vin || '',
            make: c.make || '',
            model: c.model || '',
            year: c.year || '',
            engineSize: c.engineSize || ''
          };
          return {
            ...c,
            vehicles: [legacyVehicle],
            // Clean up old keys if desired, or leave them (they won't be used by new type definition)
          };
        }
        return c;
      });
    } catch { return []; }
  },
  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getProducts: (): Product[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
    } catch { return []; }
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getOrders: (): Order[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    } catch { return []; }
  },
  saveOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  }
};