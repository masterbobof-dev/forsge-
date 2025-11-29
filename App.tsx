
import React, { useState, useEffect } from 'react';
import { Customer, Order, Product, OrderItem, OrderStatus, Vehicle, PaymentMethod } from './types';
import { StorageService } from './services/storageService';
import { StepCustomer } from './components/StepCustomer';
import { StepProduct } from './components/StepProduct';
import { OrdersView } from './components/OrdersView';
import { StatisticsView } from './components/StatisticsView';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { LayoutDashboard, Settings, Users, BarChart3, Package, PlusCircle, UserCog } from 'lucide-react';

enum Tab {
  NEW_ORDER = 'NEW_ORDER',
  CUSTOMERS_MANAGE = 'CUSTOMERS_MANAGE',
  ORDERS_LIST = 'ORDERS_LIST',
  PRODUCTS = 'PRODUCTS',
  STATISTICS = 'STATISTICS',
}

const App: React.FC = () => {
  // Global State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.NEW_ORDER);
  
  // Order Process State
  const [orderStep, setOrderStep] = useState<number>(1); // 1 = Select Customer, 2 = Add Products
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);

  // Load Data on Mount
  useEffect(() => {
    setCustomers(StorageService.getCustomers());
    setProducts(StorageService.getProducts());
    setOrders(StorageService.getOrders());
  }, []);

  // --- Handlers ---

  const handleCreateCustomer = (newCustomer: Customer) => {
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
    // If we are in the "New Order" flow, auto-select this new customer
    if (activeTab === Tab.NEW_ORDER && newCustomer.vehicles.length > 0) {
        handleSelectCustomer(newCustomer, newCustomer.vehicles[0]);
    }
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
      const updated = customers.filter(c => c.id !== customerId);
      setCustomers(updated);
      StorageService.saveCustomers(updated);
  };

  const handleSelectCustomer = (customer: Customer, vehicle: Vehicle) => {
    setCurrentCustomer(customer);
    setCurrentVehicle(vehicle);
    setOrderStep(2);
  };

  const handleFinishOrder = (items: OrderItem[], notes: string, prepayment: number, paymentMethod: PaymentMethod, expenses: number) => {
    if (!currentCustomer || !currentVehicle) return;

    // Calculate financials
    const subTotal = items.reduce((sum, i) => sum + (i.sellPrice * i.quantity), 0);
    const totalAmount = currentCustomer.discountPercent > 0 
      ? subTotal * (1 - currentCustomer.discountPercent / 100) 
      : subTotal;
    
    const totalCost = items.reduce((sum, i) => sum + (i.buyPrice * i.quantity), 0);
    // Profit = Revenue - Cost of Goods - Expenses
    const totalProfit = totalAmount - totalCost - expenses;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerId: currentCustomer.id,
      customerSnapshot: currentCustomer,
      vehicleSnapshot: currentVehicle,
      items,
      status: OrderStatus.NEW,
      date: new Date().toISOString(),
      totalAmount,
      prepayment,
      paymentMethod,
      expenses, 
      totalProfit,
      notes
    };

    // Save Order
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    StorageService.saveOrders(updatedOrders);

    // Update Product "Database" (Add new products or update prices)
    let updatedProducts = [...products];
    items.forEach(item => {
      const exists = updatedProducts.find(p => p.name === item.name);
      if (!exists) {
        updatedProducts.push({
          id: item.id,
          code: item.code,
          brand: item.brand, // Save brand
          name: item.name,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice
        });
      }
    });
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);

    // Reset Flow
    setOrderStep(1);
    setCurrentCustomer(null);
    setCurrentVehicle(null);
    setActiveTab(Tab.ORDERS_LIST);
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    StorageService.saveOrders(updated);
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    StorageService.saveOrders(updated);
  };

  const handleUpdateNotes = (orderId: string, notes: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, notes } : o);
    setOrders(updated);
    StorageService.saveOrders(updated);
  };

  const handleUpdateExpenses = (orderId: string, expenses: number) => {
    const updated = orders.map(o => {
        if (o.id === orderId) {
            const totalCost = o.items.reduce((s, i) => s + (i.buyPrice * i.quantity), 0);
            const totalProfit = o.totalAmount - totalCost - expenses;
            return { ...o, expenses, totalProfit };
        }
        return o;
    });
    setOrders(updated);
    StorageService.saveOrders(updated);
  };

  const handleUpdatePrepayment = (orderId: string, prepayment: number) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, prepayment } : o);
    setOrders(updated);
    StorageService.saveOrders(updated);
  };

  const handleCreateProduct = (product: Product) => {
    const updated = [product, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleBulkCreateProducts = (newProducts: Product[]) => {
      let updated = [...products];
      newProducts.forEach(np => {
          const idx = updated.findIndex(p => p.code === np.code && p.code !== '');
          if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...np, id: updated[idx].id }; 
          } else {
              updated.push(np);
          }
      });
      setProducts(updated);
      StorageService.saveProducts(updated);
  };

  const handleBulkUpdateProducts = (updatedProducts: Product[]) => {
    const updatesMap = new Map(updatedProducts.map(p => [p.id, p]));
    const updated = products.map(p => {
        if (updatesMap.has(p.id)) {
            return updatesMap.get(p.id)!;
        }
        return p;
    });
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Nav */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
              <Settings className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
              <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:inline">Forsage<span className="text-blue-400">Shop</span></span>
            </div>
            <nav className="flex space-x-1 md:space-x-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab(Tab.NEW_ORDER)}
                className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap ${
                  activeTab === Tab.NEW_ORDER ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Нове замовлення</span>
                <span className="md:hidden">Нове</span>
              </button>
              
               <button
                onClick={() => setActiveTab(Tab.CUSTOMERS_MANAGE)}
                className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap ${
                  activeTab === Tab.CUSTOMERS_MANAGE ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <UserCog className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Клієнти</span>
                <span className="md:hidden">Клієнти</span>
              </button>

              <button
                onClick={() => setActiveTab(Tab.ORDERS_LIST)}
                className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap ${
                  activeTab === Tab.ORDERS_LIST ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Замовлення</span>
                <span className="md:hidden">Зам.</span>
              </button>
              <button
                onClick={() => setActiveTab(Tab.PRODUCTS)}
                className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap ${
                  activeTab === Tab.PRODUCTS ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Товари</span>
                <span className="md:hidden">Тов.</span>
              </button>
              <button
                onClick={() => setActiveTab(Tab.STATISTICS)}
                className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap ${
                  activeTab === Tab.STATISTICS ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Статистика</span>
                <span className="md:hidden">Стат.</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 w-full">
        
        {activeTab === Tab.NEW_ORDER && (
          <div className="h-full">
            {orderStep === 1 && (
              <StepCustomer 
                existingCustomers={customers} 
                onSelectCustomer={handleSelectCustomer}
                onSaveNewCustomer={handleCreateCustomer}
              />
            )}
            {orderStep === 2 && currentCustomer && currentVehicle && (
              <StepProduct 
                customer={currentCustomer}
                vehicle={currentVehicle}
                existingProducts={products}
                onFinishOrder={handleFinishOrder}
                onBack={() => setOrderStep(1)}
              />
            )}
          </div>
        )}

        {activeTab === Tab.CUSTOMERS_MANAGE && (
            <CustomersView 
                customers={customers}
                orders={orders}
                onCreate={handleCreateCustomer}
                onUpdate={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
            />
        )}

        {activeTab === Tab.ORDERS_LIST && (
          <OrdersView 
            orders={orders} 
            onUpdateStatus={handleUpdateStatus}
            onDeleteOrder={handleDeleteOrder}
            onUpdateNotes={handleUpdateNotes}
            onUpdateExpenses={handleUpdateExpenses}
            onUpdatePrepayment={handleUpdatePrepayment}
          />
        )}

        {activeTab === Tab.PRODUCTS && (
            <ProductsView 
                products={products}
                onCreate={handleCreateProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onBulkCreate={handleBulkCreateProducts}
                onBulkUpdate={handleBulkUpdateProducts}
            />
        )}

        {activeTab === Tab.STATISTICS && (
            <StatisticsView orders={orders} />
        )}
      </main>
    </div>
  );
};

export default App;
