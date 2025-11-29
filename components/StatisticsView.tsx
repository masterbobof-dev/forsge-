import React, { useMemo, useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { TrendingUp, Wallet, AlertOctagon, ShoppingBag, Calendar, Filter } from 'lucide-react';

interface Props {
  orders: Order[];
}

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';

export const StatisticsView: React.FC<Props> = ({ orders }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize dates on mount or period change
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (period === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (period === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Sunday
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (period === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [period]);

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    if (!startDate || !endDate) return orders;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate, period]);

  const stats = useMemo(() => {
    const initial = {
      revenue: 0,
      profit: 0,
      debt: 0,
      count: 0,
      byStatus: {} as Record<OrderStatus, number>
    };

    const customerSpending: Record<string, {name: string, total: number, orders: number}> = {};

    // Statuses that are considered "Sold" where profit is realized
    const REALIZED_STATUSES = [OrderStatus.PICKED_UP, OrderStatus.PAID, OrderStatus.DEBT];

    filteredOrders.forEach(o => {
      initial.revenue += o.totalAmount;
      initial.count++;
      
      // Only count profit if the customer has picked up the item (or paid/debt)
      if (REALIZED_STATUSES.includes(o.status)) {
        initial.profit += o.totalProfit;
      }
      
      if (o.status === OrderStatus.DEBT) {
        initial.debt += o.totalAmount;
      }

      initial.byStatus[o.status] = (initial.byStatus[o.status] || 0) + 1;

      if (!customerSpending[o.customerId]) {
        customerSpending[o.customerId] = {
          name: o.customerSnapshot.name,
          total: 0,
          orders: 0
        };
      }
      customerSpending[o.customerId].total += o.totalAmount;
      customerSpending[o.customerId].orders += 1;
    });

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { ...initial, topCustomers };
  }, [filteredOrders]);

  const statusLabels: Record<string, string> = {
    [OrderStatus.NEW]: 'Новий',
    [OrderStatus.RECEIVED]: 'Отримали товар',
    [OrderStatus.NOTIFIED]: 'Клієнт сповіщений',
    [OrderStatus.PICKED_UP]: 'Забрав',
    [OrderStatus.PAID]: 'Оплатив',
    [OrderStatus.DEBT]: 'Борг',
  };

  const statusColors: Record<string, string> = {
    [OrderStatus.NEW]: 'bg-blue-600',
    [OrderStatus.RECEIVED]: 'bg-yellow-500',
    [OrderStatus.NOTIFIED]: 'bg-purple-500',
    [OrderStatus.PICKED_UP]: 'bg-indigo-500',
    [OrderStatus.PAID]: 'bg-green-600',
    [OrderStatus.DEBT]: 'bg-red-600',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Статистика магазину</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
          {/* Quick Filters */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setPeriod('today')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${period === 'today' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Сьогодні</button>
             <button onClick={() => setPeriod('week')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${period === 'week' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Тиждень</button>
             <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${period === 'month' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Місяць</button>
             <button onClick={() => setPeriod('all')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${period === 'all' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Весь час</button>
          </div>

          {/* Date Custom Inputs */}
          {period !== 'all' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400 ml-1" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => { setStartDate(e.target.value); setPeriod('custom'); }}
                  className="text-sm border-none focus:ring-0 p-0 text-gray-600 w-32"
                />
                <span className="text-gray-300">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => { setEndDate(e.target.value); setPeriod('custom'); }}
                  className="text-sm border-none focus:ring-0 p-0 text-gray-600 w-32"
                />
            </div>
          )}
        </div>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Загальний продаж</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.revenue.toLocaleString()} грн</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Чистий прибуток</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.profit.toLocaleString()} грн</h3>
                    <span className="text-xs text-gray-400 mb-1">(реалізований)</span>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Wallet className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Активний борг</p>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.debt.toLocaleString()} грн</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <AlertOctagon className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Замовлень за період</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.count}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Топ клієнтів</h3>
              <span className="text-xs text-gray-400 uppercase font-bold">За обраний період</span>
           </div>
           <div className="p-4">
              {stats.topCustomers.length === 0 ? (
                 <p className="text-gray-500 text-sm text-center py-4">Немає даних за цей період</p>
              ) : (
                <div className="space-y-4">
                  {stats.topCustomers.map((c, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                       <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mr-3 font-bold text-xs">
                             {i + 1}
                          </div>
                          <div>
                             <p className="text-sm font-medium text-gray-900">{c.name}</p>
                             <p className="text-xs text-gray-500">{c.orders} замовлень</p>
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">
                          {c.total.toLocaleString()} грн
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Status Breakdown */}
         <div className="bg-white rounded-lg shadow border border-gray-200">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Статус замовлень</h3>
              <span className="text-xs text-gray-400 uppercase font-bold">За обраний період</span>
           </div>
           <div className="p-4">
              {stats.count === 0 ? (
                 <p className="text-gray-500 text-sm text-center py-4">Немає замовлень за цей період</p>
              ) : (
                <div className="space-y-4">
                    {Object.values(OrderStatus).map(status => {
                        const count = stats.byStatus[status] || 0;
                        const percent = stats.count > 0 ? (count / stats.count) * 100 : 0;
                        
                        if (count === 0) return null;

                        return (
                            <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 font-medium">{statusLabels[status]}</span>
                                <span className="text-gray-500">{count} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                            </div>
                        );
                    })}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
