
import React, { useState, useMemo } from 'react';
import { Customer, Vehicle, Order, OrderStatus } from '../types';
import { Search, UserPlus, Car, Edit, Trash2, Plus, X, Phone, Calendar, ArrowLeft, History, ShoppingBag, FileText, AlertTriangle, Cake, Gift } from 'lucide-react';

interface Props {
  customers: Customer[];
  orders: Order[];
  onCreate: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'Новий',
  [OrderStatus.RECEIVED]: 'Отримали товар',
  [OrderStatus.NOTIFIED]: 'Клієнт сповіщений',
  [OrderStatus.PAID]: 'Оплатив',
  [OrderStatus.PICKED_UP]: 'Забрав',
  [OrderStatus.DEBT]: 'Борг',
};

const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: 'bg-blue-100 text-blue-800',
    [OrderStatus.RECEIVED]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.NOTIFIED]: 'bg-purple-100 text-purple-800',
    [OrderStatus.PICKED_UP]: 'bg-green-100 text-green-800',
    [OrderStatus.PAID]: 'bg-green-100 text-green-800',
    [OrderStatus.DEBT]: 'bg-red-100 text-red-800',
};

export const CustomersView: React.FC<Props> = ({ customers, orders, onCreate, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'history'>('list');
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // History View State
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    birthDate: '',
    discountPercent: 0,
    vehicles: []
  });

  const filteredCustomers = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.phone.includes(lower) || 
      c.vehicles.some(v => v.vin.toLowerCase().includes(lower) || v.make.toLowerCase().includes(lower))
    );
  }, [customers, searchTerm]);

  const customerHistoryOrders = useMemo(() => {
      if (!historyCustomer) return [];
      return orders
        .filter(o => o.customerId === historyCustomer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, historyCustomer]);

  const customerTotalSpent = useMemo(() => {
      return customerHistoryOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [customerHistoryOrders]);

  // --- Birthday Logic ---
  const getUpcomingBirthdayDetails = (birthDateStr?: string) => {
      if (!birthDateStr) return null;
      const today = new Date();
      today.setHours(0,0,0,0);
      const birth = new Date(birthDateStr);
      
      // Construct date for this year
      let target = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      
      // If birthday has passed this year, check next year (handle edge case where today is Dec 30 and bday is Jan 2)
      if (target < today) {
          target = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
      }
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 7) {
          return diffDays === 0 ? 'Сьогодні!' : `через ${diffDays} дн.`;
      }
      return null;
  };

  const customersWithBirthdays = useMemo(() => {
      return customers
        .map(c => ({ customer: c, label: getUpcomingBirthdayDetails(c.birthDate) }))
        .filter(item => item.label !== null);
  }, [customers]);

  // --- Form Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
        id: crypto.randomUUID(),
        make: '',
        model: '',
        year: '',
        engineSize: '',
        vin: ''
    };
    setFormData(prev => ({ ...prev, vehicles: [...prev.vehicles, newVehicle] }));
  };

  const handleRemoveVehicle = (index: number) => {
    const updated = [...formData.vehicles];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, vehicles: updated }));
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    const updated = [...formData.vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, vehicles: updated }));
  };

  // --- Actions ---

  const startCreating = () => {
    setFormData({
        id: crypto.randomUUID(),
        name: '',
        phone: '',
        birthDate: '',
        discountPercent: 0,
        vehicles: [{
            id: crypto.randomUUID(),
            make: '',
            model: '',
            year: '',
            engineSize: '',
            vin: ''
        }]
    });
    setViewMode('create');
  };

  const startEditing = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setFormData({ ...customer });
    setViewMode('edit');
  };

  const openHistory = (customer: Customer) => {
      setHistoryCustomer(customer);
      setViewMode('history');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const customerToSave: Customer = {
      ...formData,
      discountPercent: Number(formData.discountPercent),
      vehicles: formData.vehicles
    };

    if (viewMode === 'create') {
        onCreate(customerToSave);
    } else {
        onUpdate(customerToSave);
    }
    setViewMode('list');
  };

  const handleDelete = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: 'Видалити клієнта',
          message: 'Ви впевнені, що хочете видалити цього клієнта та всю його історію? Цю дію неможливо скасувати.',
          onConfirm: () => {
              onDelete(id);
              setViewMode('list');
              setConfirmModal(null);
          }
      });
  }

  // --- Render History ---
  if (viewMode === 'history' && historyCustomer) {
      return (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
              {/* Header */}
              <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-200 rounded-full transition">
                          <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">{historyCustomer.name}</h2>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {historyCustomer.phone}</span>
                              <span className="flex items-center"><History className="w-3 h-3 mr-1"/> Історія замовлень</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex gap-4">
                      <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <div className="text-xs text-gray-500 uppercase font-bold">Загальна сума</div>
                          <div className="text-xl font-bold text-blue-600">{customerTotalSpent.toLocaleString()} грн</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                          <div className="text-xs text-gray-500 uppercase font-bold">К-сть замовлень</div>
                          <div className="text-xl font-bold text-purple-600">{customerHistoryOrders.length}</div>
                      </div>
                  </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto p-0">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Авто</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товари</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сума</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {customerHistoryOrders.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                      У цього клієнта ще немає замовлень
                                  </td>
                              </tr>
                          ) : (
                              customerHistoryOrders.map(order => (
                                  <tr key={order.id} className="hover:bg-gray-50 transition">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                          <div className="font-bold">{new Date(order.date).toLocaleDateString()}</div>
                                          <div className="text-xs text-gray-500">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                          {order.vehicleSnapshot ? (
                                              <div>
                                                  <div className="font-medium">{order.vehicleSnapshot.make} {order.vehicleSnapshot.model}</div>
                                                  <div className="text-xs font-mono text-gray-400">{order.vehicleSnapshot.vin}</div>
                                              </div>
                                          ) : (
                                              <span className="text-gray-400">-</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-600">
                                          <ul className="list-disc list-inside space-y-1">
                                              {order.items.slice(0, 3).map((item, i) => (
                                                  <li key={i} className="truncate max-w-[200px]" title={item.name}>
                                                      {item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span>
                                                  </li>
                                              ))}
                                              {order.items.length > 3 && (
                                                  <li className="text-blue-500 text-xs pl-4 font-medium">
                                                      + ще {order.items.length - 3} ...
                                                  </li>
                                              )}
                                          </ul>
                                          {order.notes && (
                                              <div className="mt-2 text-xs text-amber-600 flex items-center">
                                                  <FileText className="w-3 h-3 mr-1"/> {order.notes}
                                              </div>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                          {order.totalAmount.toLocaleString()} грн
                                          {order.prepayment > 0 && (order.totalAmount - order.prepayment) > 0 && (
                                              <div className="text-xs text-red-500 font-normal">
                                                  Борг: {(order.totalAmount - order.prepayment).toLocaleString()}
                                              </div>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                              {statusLabels[order.status]}
                                          </span>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  // --- Render Form ---
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-fade-in max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800">
            {viewMode === 'create' ? (
                <>
                    <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
                    Новий клієнт
                </>
            ) : (
                <>
                    <Edit className="w-6 h-6 mr-2 text-orange-600" />
                    Редагування картки клієнта
                </>
            )}
          </h2>
          <button onClick={() => setViewMode('list')} className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1 rounded">
            Скасувати
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center border-b pb-1">
                    Особисті дані
                </h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ПІБ Клієнта</label>
                    <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="Іваненко Іван Іванович" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="+380 00 000 00 00" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата народження</label>
                    <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Персональна знижка (%)</label>
                    <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        name="discountPercent" 
                        value={formData.discountPercent} 
                        onChange={handleInputChange} 
                        className="w-full border-2 border-green-100 rounded p-2 focus:ring-2 focus:ring-green-500 text-green-700 font-bold" 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-1">
                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center">
                        <Car className="w-4 h-4 mr-2"/> Автопарк
                    </h3>
                    <button type="button" onClick={handleAddVehicle} className="text-xs flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                        <Plus className="w-3 h-3 mr-1" /> Додати авто
                    </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {formData.vehicles.map((vehicle, index) => (
                        <div key={vehicle.id || index} className="bg-blue-50 p-3 rounded-md border border-blue-100 relative group">
                            <button 
                                type="button" 
                                onClick={() => handleRemoveVehicle(index)}
                                className="absolute top-2 right-2 text-red-300 hover:text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">VIN Код</label>
                                    <input 
                                        value={vehicle.vin} 
                                        onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)} 
                                        className="w-full border rounded p-1.5 font-mono text-xs uppercase" 
                                        placeholder="XTA..." 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Марка</label>
                                        <input 
                                            value={vehicle.make} 
                                            onChange={(e) => handleVehicleChange(index, 'make', e.target.value)} 
                                            className="w-full border rounded p-1.5 text-sm" 
                                            placeholder="Toyota" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Модель</label>
                                        <input 
                                            value={vehicle.model} 
                                            onChange={(e) => handleVehicleChange(index, 'model', e.target.value)} 
                                            className="w-full border rounded p-1.5 text-sm" 
                                            placeholder="Camry" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Рік</label>
                                        <input 
                                            type="number" 
                                            value={vehicle.year} 
                                            onChange={(e) => handleVehicleChange(index, 'year', e.target.value)} 
                                            className="w-full border rounded p-1.5 text-sm" 
                                            placeholder="2018" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Об'єм</label>
                                        <input 
                                            value={vehicle.engineSize} 
                                            onChange={(e) => handleVehicleChange(index, 'engineSize', e.target.value)} 
                                            className="w-full border rounded p-1.5 text-sm" 
                                            placeholder="2.5" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
              {viewMode === 'edit' && (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(formData.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3 px-6 rounded-md transition"
                  >
                      Видалити
                  </button>
              )}
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition duration-200 shadow-md">
                {viewMode === 'create' ? 'Створити клієнта' : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Render List ---
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">База Клієнтів</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-96">
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Пошук клієнта за ім'ям, телефоном або VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <button 
                onClick={startCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow"
            >
                <UserPlus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Додати</span>
            </button>
        </div>
      </div>

      {/* Birthday Banner */}
      {viewMode === 'list' && customersWithBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm animate-fade-in">
              <div className="p-2 bg-white rounded-full text-pink-500 shadow-sm shrink-0">
                  <Gift className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center">
                      Найближчі свята 
                      <span className="ml-2 text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-pink-100">7 днів</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                      {customersWithBirthdays.map(({ customer, label }) => (
                          <div 
                            key={customer.id} 
                            onClick={() => openHistory(customer)}
                            className="flex items-center bg-white px-3 py-1 rounded-full border border-pink-100 shadow-sm text-sm cursor-pointer hover:bg-pink-50 transition"
                          >
                              <Cake className="w-3 h-3 text-pink-500 mr-2" />
                              <span className="font-bold text-gray-800 mr-1">{customer.name}</span>
                              <span className="text-pink-500 text-xs font-bold">({label})</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                  {searchTerm ? 'Клієнтів не знайдено' : 'Список клієнтів порожній. Додайте першого клієнта!'}
              </div>
          ) : (
              filteredCustomers.map(customer => {
                  const birthdayLabel = getUpcomingBirthdayDetails(customer.birthDate);
                  return (
                    <div 
                        key={customer.id} 
                        onClick={() => openHistory(customer)}
                        className={`bg-white border rounded-lg p-5 hover:shadow-lg transition group relative cursor-pointer ${birthdayLabel ? 'border-pink-300 ring-1 ring-pink-100' : 'border-gray-200'}`}
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button 
                                onClick={(e) => startEditing(e, customer)}
                                className="p-2 bg-gray-100 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-full transition"
                                title="Редагувати"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${birthdayLabel ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-700'}`}>
                                {birthdayLabel ? <Cake className="w-5 h-5"/> : customer.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight">{customer.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {customer.discountPercent > 0 && (
                                        <span className="inline-block bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                            Знижка {customer.discountPercent}%
                                        </span>
                                    )}
                                    {birthdayLabel && (
                                        <span className="inline-block bg-pink-100 text-pink-800 text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                            ДН: {birthdayLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                            {customer.birthDate && (
                                <div className={`flex items-center gap-2 ${birthdayLabel ? 'text-pink-600 font-medium' : ''}`}>
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{new Date(customer.birthDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                                <Car className="w-3 h-3 mr-1" /> Автомобілі ({customer.vehicles.length})
                            </div>
                            <div className="space-y-1">
                                {customer.vehicles.slice(0, 2).map((v, idx) => (
                                    <div key={idx} className="text-sm bg-gray-50 px-2 py-1 rounded text-gray-700 truncate">
                                        {v.make} {v.model} <span className="text-gray-400">({v.year})</span>
                                    </div>
                                ))}
                                {customer.vehicles.length > 2 && (
                                    <div className="text-xs text-blue-600 pl-1">
                                        + ще {customer.vehicles.length - 2} авто...
                                    </div>
                                )}
                                {customer.vehicles.length === 0 && (
                                    <div className="text-xs text-gray-400 italic">Авто не додано</div>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <span className="text-xs font-bold text-blue-600 group-hover:underline">Показати історію замовлень</span>
                            </div>
                        </div>
                    </div>
                  );
              })
          )}
      </div>

       {/* Confirmation Modal */}
       {confirmModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-red-100 text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{confirmModal.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setConfirmModal(null)} 
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                            Скасувати
                        </button>
                        <button 
                            onClick={confirmModal.onConfirm} 
                            className="px-4 py-2 text-white rounded-lg font-bold shadow-lg transition bg-red-600 hover:bg-red-700"
                        >
                            Підтвердити
                        </button>
                    </div>
                </div>
            </div>
         )}
    </div>
  );
};
