
import React, { useState, useEffect, useRef } from 'react';
import { Customer, Product, OrderItem, MARKUP_OPTIONS, Vehicle, PaymentMethod } from '../types';
import { Plus, Trash2, ShoppingCart, Search, Calculator, CheckCircle, FileText, Car, CreditCard, Banknote, ArrowRightLeft, Truck } from 'lucide-react';

interface Props {
  customer: Customer;
  vehicle: Vehicle;
  existingProducts: Product[];
  onFinishOrder: (items: OrderItem[], notes: string, prepayment: number, paymentMethod: PaymentMethod, expenses: number) => void;
  onBack: () => void;
}

export const StepProduct: React.FC<Props> = ({ customer, vehicle, existingProducts, onFinishOrder, onBack }) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Payment State
  const [prepayment, setPrepayment] = useState<string>('');
  const [expenses, setExpenses] = useState<string>(''); // New expenses state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Current Item State
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Suggestions logic
  const suggestions = name.length > 1 
    ? existingProducts.filter(p => p.name.toLowerCase().includes(name.toLowerCase())).slice(0, 5) 
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyMarkup = (percent: number) => {
    const buy = parseFloat(buyPrice);
    if (!isNaN(buy)) {
      const sell = buy + (buy * (percent / 100));
      setSellPrice(sell.toFixed(0)); // Usually parts prices are integers or rounded
    }
  };

  const handleSelectProduct = (product: Product) => {
    setName(product.name);
    setCode(product.code);
    setBrand(product.brand || '');
    setBuyPrice(product.buyPrice.toString());
    setSellPrice(product.sellPrice.toString());
    setShowSuggestions(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellPrice) return;

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      code,
      brand,
      name,
      buyPrice: parseFloat(buyPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      quantity: parseInt(quantity) || 1
    };

    setItems([...items, newItem]);
    
    // Reset form
    setCode('');
    setBrand('');
    setName('');
    setBuyPrice('');
    setSellPrice('');
    setQuantity('1');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const total = calculateTotal();
  const discountedTotal = customer.discountPercent > 0 ? total * (1 - customer.discountPercent / 100) : total;
  
  // Calculate remaining
  const prepaymentAmount = parseFloat(prepayment) || 0;
  const remaining = Math.max(0, discountedTotal - prepaymentAmount);
  
  // Parse expenses
  const expensesAmount = parseFloat(expenses) || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-20 lg:pb-0">
      {/* Left Column: Product Entry */}
      <div className="lg:w-2/3 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-3 border-b pb-4">
             <div>
                <h2 className="text-xl font-bold text-gray-800">Додавання товару</h2>
                <div className="text-sm text-gray-500 mt-1">
                    Замовник: <span className="font-medium text-gray-900">{customer.name}</span>
                </div>
             </div>
             
             <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 text-sm text-blue-800">
                <Car className="w-4 h-4 mr-2" />
                <div className="flex flex-col sm:flex-row sm:gap-1 font-bold">
                    <span>{vehicle.make} {vehicle.model}</span>
                    <span className="font-normal text-blue-600">{vehicle.year}</span>
                    <span className="font-mono text-xs text-gray-500 bg-white px-1 rounded border border-blue-100 self-center">{vehicle.vin}</span>
                </div>
             </div>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
             {/* Name Search/Input */}
             <div className="relative" ref={suggestionRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Найменування (Номенклатура)</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
                        className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Почніть вводити назву..."
                        required
                        autoComplete="off"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded-b-md mt-1">
                        {suggestions.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => handleSelectProduct(p)}
                                className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 flex justify-between"
                            >
                                <div>
                                    <span className="font-medium text-gray-900">{p.name}</span>
                                    {p.brand && <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{p.brand}</span>}
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs mr-2">{p.code}</span>
                                    <span className="font-bold text-gray-700 text-xs">{p.sellPrice} грн</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Код товару</label>
                    <input 
                        value={code} 
                        onChange={e => setCode(e.target.value)} 
                        className="w-full border rounded p-2 text-sm" 
                        placeholder="A123..." 
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Бренд</label>
                    <input 
                        value={brand} 
                        onChange={e => setBrand(e.target.value)} 
                        className="w-full border rounded p-2 text-sm" 
                        placeholder="Bosch" 
                    />
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Кількість</label>
                    <input 
                        type="number" 
                        min="1"
                        value={quantity} 
                        onChange={e => setQuantity(e.target.value)} 
                        className="w-full border rounded p-2 text-center" 
                    />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-50 p-4 rounded-md border border-slate-200">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ціна закупівлі (грн)</label>
                    <input 
                        type="number" 
                        value={buyPrice} 
                        onChange={e => setBuyPrice(e.target.value)} 
                        className="w-full border rounded p-2" 
                        placeholder="0" 
                    />
                </div>
                
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                        <Calculator className="w-3 h-3 mr-1"/> Швидка націнка
                     </label>
                     <div className="flex flex-wrap gap-1">
                         {MARKUP_OPTIONS.map(percent => (
                             <button
                                type="button"
                                key={percent}
                                onClick={() => handleApplyMarkup(percent)}
                                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-blue-50 hover:border-blue-300 transition"
                             >
                                {percent}%
                             </button>
                         ))}
                     </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Ціна продажу (грн)</label>
                    <input 
                        type="number" 
                        value={sellPrice} 
                        onChange={e => setSellPrice(e.target.value)} 
                        required
                        className="w-full border-2 border-blue-500 rounded p-2 text-lg font-bold text-gray-900" 
                        placeholder="0" 
                    />
                </div>
             </div>

             <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded flex justify-center items-center gap-2">
                <Plus className="w-5 h-5" />
                Додати в список
             </button>
          </form>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:w-1/3 flex flex-col h-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col">
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="font-bold text-lg flex items-center text-gray-700">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Склад замовлення
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">Кошик порожній</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                            <div className="flex-1 pr-2">
                                <div className="font-medium text-sm text-gray-900">
                                    {item.brand && <span className="text-xs font-bold text-gray-500 mr-1">{item.brand}</span>}
                                    {item.name}
                                </div>
                                <div className="text-xs text-gray-500">{item.code}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {item.quantity} шт x {item.sellPrice.toLocaleString()} грн
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="font-bold text-gray-900 text-sm">{(item.sellPrice * item.quantity).toLocaleString()} грн</div>
                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t rounded-b-lg space-y-3">
                {/* Payment Fields */}
                <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Метод оплати</label>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex-1 py-1.5 px-2 text-xs border rounded flex items-center justify-center gap-1 ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Banknote className="w-3 h-3"/> Готівка
                            </button>
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod('CARD')}
                                className={`flex-1 py-1.5 px-2 text-xs border rounded flex items-center justify-center gap-1 ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <CreditCard className="w-3 h-3"/> Картка
                            </button>
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod('TRANSFER')}
                                className={`flex-1 py-1.5 px-2 text-xs border rounded flex items-center justify-center gap-1 ${paymentMethod === 'TRANSFER' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <ArrowRightLeft className="w-3 h-3"/> Переказ
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Передоплата</label>
                            <input 
                                type="number"
                                min="0"
                                value={prepayment}
                                onChange={(e) => setPrepayment(e.target.value)}
                                className="w-full border rounded p-1.5 text-sm"
                                placeholder="0"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center" title="Доставка та інші витрати">
                                <Truck className="w-3 h-3 mr-1"/> Витрати
                             </label>
                            <input 
                                type="number"
                                min="0"
                                value={expenses}
                                onChange={(e) => setExpenses(e.target.value)}
                                className="w-full border rounded p-1.5 text-sm"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes Field */}
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                         <FileText className="w-3 h-3 mr-1" /> Примітки
                     </label>
                     <textarea 
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full border rounded p-2 text-sm h-12 resize-none"
                        placeholder="Доставка, деталі..."
                     />
                </div>

                <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                    <span>Підсумок:</span>
                    <span>{total.toLocaleString()} грн</span>
                </div>
                {customer.discountPercent > 0 && (
                     <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Знижка ({customer.discountPercent}%):</span>
                        <span>-{(total - discountedTotal).toLocaleString()} грн</span>
                    </div>
                )}
                
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                    <span>Разом:</span>
                    <span>{discountedTotal.toLocaleString()} грн</span>
                </div>

                {/* Remaining Balance */}
                 <div className="flex justify-between text-sm font-medium pt-1 border-t border-dashed border-gray-300">
                    <span className="text-gray-600">Залишок до сплати:</span>
                    <span className={`${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {remaining.toLocaleString()} грн
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button onClick={onBack} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition">
                        Скасувати
                    </button>
                    <button 
                        disabled={items.length === 0}
                        onClick={() => onFinishOrder(items, orderNotes, prepaymentAmount, paymentMethod, expensesAmount)} 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Оформити
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg flex justify-between items-center z-40">
           <div className="flex flex-col">
               <span className="text-xs text-gray-500">До сплати:</span>
               <span className="font-bold text-xl text-gray-900">{discountedTotal.toLocaleString()} грн</span>
           </div>
           <div className="flex gap-2">
               <button onClick={onBack} className="p-2 border border-gray-300 rounded text-gray-600">
                    <Trash2 className="w-5 h-5"/>
               </button>
               <button 
                    disabled={items.length === 0}
                    onClick={() => onFinishOrder(items, orderNotes, prepaymentAmount, paymentMethod, expensesAmount)} 
                    className="px-6 py-2 bg-green-600 text-white rounded font-bold shadow-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
               >
                   <CheckCircle className="w-5 h-5 mr-2" />
                   Оформити
               </button>
           </div>
      </div>
    </div>
  );
};
