
import React, { useState, useEffect } from 'react';
import { Customer, Vehicle } from '../types';
import { Search, UserPlus, Car, ChevronRight, X, User, AlertCircle } from 'lucide-react';

interface Props {
  existingCustomers: Customer[];
  onSelectCustomer: (customer: Customer, vehicle: Vehicle) => void;
  onSaveNewCustomer: (customer: Customer) => void;
}

export const StepCustomer: React.FC<Props> = ({ 
  existingCustomers, 
  onSelectCustomer, 
  onSaveNewCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  
  // Selection Modal State
  const [selectedCustomerForVehicle, setSelectedCustomerForVehicle] = useState<Customer | null>(null);
  
  // Error Message State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Create Form State
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    birthDate: '',
    discountPercent: 0,
    vehicles: []
  });

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    // Default show latest 5 customers if search empty
    if (!lowerTerm) {
        setSearchResults(existingCustomers.slice(-5).reverse());
        return;
    }
    const results = existingCustomers.filter(c => 
      c.name.toLowerCase().includes(lowerTerm) || 
      c.phone.includes(lowerTerm) || 
      c.vehicles.some(v => v.vin.toLowerCase().includes(lowerTerm) || v.make.toLowerCase().includes(lowerTerm))
    );
    setSearchResults(results);
  }, [searchTerm, existingCustomers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Quick Create Actions ---

  const startQuickCreating = () => {
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
    setIsQuickCreating(true);
  };

  const handleVehicleChange = (field: keyof Vehicle, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[0] = { ...updatedVehicles[0], [field]: value };
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const customerToSave: Customer = {
      ...formData,
      discountPercent: Number(formData.discountPercent),
      vehicles: formData.vehicles
    };
    onSaveNewCustomer(customerToSave);
    setIsQuickCreating(false);
  };

  const handleCustomerClick = (customer: Customer) => {
    setErrorMessage(null); // Clear previous errors
    if (customer.vehicles.length === 1) {
        onSelectCustomer(customer, customer.vehicles[0]);
    } else if (customer.vehicles.length > 1) {
        setSelectedCustomerForVehicle(customer);
    } else {
        // Edge case: No cars
        setErrorMessage('У цього клієнта немає авто. Перейдіть у вкладку "Клієнти" та додайте авто.');
        setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // --- Renders ---

  if (isQuickCreating) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-xl border border-blue-100 animate-slide-in-top">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800">
             <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
             Швидке створення клієнта
          </h2>
          <button onClick={() => setIsQuickCreating(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ПІБ</label>
                    <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="Прізвище Ім'я" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="099..." />
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Car className="w-4 h-4 mr-2"/> Автомобіль</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input required value={formData.vehicles[0].make} onChange={e => handleVehicleChange('make', e.target.value)} className="border rounded p-2 text-sm" placeholder="Марка (Toyota)" />
                    <input required value={formData.vehicles[0].model} onChange={e => handleVehicleChange('model', e.target.value)} className="border rounded p-2 text-sm" placeholder="Модель (Camry)" />
                    <input value={formData.vehicles[0].year} onChange={e => handleVehicleChange('year', e.target.value)} className="border rounded p-2 text-sm" placeholder="Рік" />
                    <input value={formData.vehicles[0].vin} onChange={e => handleVehicleChange('vin', e.target.value)} className="border rounded p-2 text-sm font-mono uppercase" placeholder="VIN Код" />
                </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md shadow-md">
                Створити та вибрати
            </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative h-full flex flex-col justify-center">
      <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Нове замовлення</h1>
          <p className="text-gray-500">Оберіть клієнта, щоб розпочати оформлення</p>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
                type="text"
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-sm transition"
                placeholder="Пошук: Ім'я, Телефон або VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
            />
        </div>

        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
            {searchResults.length === 0 && searchTerm ? (
                <div className="text-center py-8">
                     <p className="text-gray-500 mb-4">Клієнта не знайдено</p>
                     <button onClick={startQuickCreating} className="text-blue-600 font-bold hover:underline">Створити нового?</button>
                </div>
            ) : (
                searchResults.map(customer => (
                    <div 
                        key={customer.id} 
                        onClick={() => handleCustomerClick(customer)}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white transition">
                                <User className="w-6 h-6 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
                                <p className="text-gray-500">{customer.phone}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                             {/* Mini Vehicle Preview */}
                             <div className="hidden sm:flex flex-col items-end text-sm text-gray-500">
                                {customer.vehicles.slice(0, 1).map(v => (
                                    <span key={v.id}>{v.make} {v.model} <span className="text-gray-400">{v.year}</span></span>
                                ))}
                                {customer.vehicles.length > 1 && <span className="text-xs text-blue-500">+{customer.vehicles.length - 1} авто</span>}
                             </div>
                             <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600" />
                        </div>
                    </div>
                ))
            )}
        </div>

        {!searchTerm && (
            <button 
                onClick={startQuickCreating}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
                <UserPlus className="w-5 h-5" />
                Створити нового клієнта
            </button>
        )}
      </div>

      {/* Vehicle Selection Modal */}
      {selectedCustomerForVehicle && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-lg">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-lg w-full animate-scale-up">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="text-2xl font-bold text-gray-900">Оберіть авто</h3>
                          <p className="text-gray-500">Клієнт: {selectedCustomerForVehicle.name}</p>
                      </div>
                      <button onClick={() => setSelectedCustomerForVehicle(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="space-y-3">
                      {selectedCustomerForVehicle.vehicles.map(vehicle => (
                          <button
                            key={vehicle.id}
                            onClick={() => {
                                onSelectCustomer(selectedCustomerForVehicle, vehicle);
                                setSelectedCustomerForVehicle(null);
                            }}
                            className="w-full flex justify-between items-center p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition group text-left"
                          >
                              <div>
                                  <div className="font-bold text-xl text-gray-800 group-hover:text-blue-700">
                                      {vehicle.make} {vehicle.model}
                                  </div>
                                  <div className="text-sm text-gray-500 font-mono mt-1">
                                      {vehicle.vin || 'VIN не вказано'}
                                  </div>
                              </div>
                              <div className="text-lg font-bold text-gray-400 group-hover:text-blue-500">
                                  {vehicle.year}
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
