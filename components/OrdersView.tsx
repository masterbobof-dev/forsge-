
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Search, ChevronDown, ChevronUp, Package, Check, Trash2, FileText, Save, CheckCircle2, Circle, CreditCard, Banknote, ArrowRightLeft, Truck, Pencil, Wallet, AlertTriangle, User, Car, Calendar } from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateNotes: (orderId: string, notes: string) => void;
  onUpdateExpenses: (orderId: string, expenses: number) => void;
  onUpdatePrepayment: (orderId: string, prepayment: number) => void;
}

const STATUS_FLOW = [
  OrderStatus.NEW,
  OrderStatus.RECEIVED,
  OrderStatus.NOTIFIED,
  OrderStatus.PAID,
  OrderStatus.PICKED_UP
];

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.NEW]: 'Новий',
  [OrderStatus.RECEIVED]: 'Отримали товар',
  [OrderStatus.NOTIFIED]: 'Клієнт сповіщений',
  [OrderStatus.PAID]: 'Оплатив',
  [OrderStatus.PICKED_UP]: 'Забрав',
  [OrderStatus.DEBT]: 'Борг',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
    'CASH': 'Готівка',
    'CARD': 'Картка',
    'TRANSFER': 'Переказ'
};

const PaymentIcon: React.FC<{method: PaymentMethod}> = ({method}) => {
    if (method === 'CARD') return <CreditCard className="w-3 h-3 text-blue-500" />;
    if (method === 'TRANSFER') return <ArrowRightLeft className="w-3 h-3 text-purple-500" />;
    return <Banknote className="w-3 h-3 text-green-500" />;
};

export const OrdersView: React.FC<Props> = ({ orders, onUpdateStatus, onDeleteOrder, onUpdateNotes, onUpdateExpenses, onUpdatePrepayment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // Local state for editing notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Local state for editing expenses
  const [editingExpensesId, setEditingExpensesId] = useState<string | null>(null);
  const [expensesValue, setExpensesValue] = useState('');

  // Local state for editing prepayment
  const [editingPrepaymentId, setEditingPrepaymentId] = useState<string | null>(null);
  const [prepaymentValue, setPrepaymentValue] = useState('');

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const lower = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.customerSnapshot.name.toLowerCase().includes(lower) ||
      o.customerSnapshot.phone.includes(lower) ||
      (o.vehicleSnapshot && o.vehicleSnapshot.vin.toLowerCase().includes(lower)) ||
      o.id.slice(0, 8).includes(lower)
    );
  }, [orders, searchTerm]);

  // Sort by date desc
  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
    setEditingNoteId(null);
    setEditingExpensesId(null);
    setEditingPrepaymentId(null);
  };

  const handleStatusUpdate = (e: React.MouseEvent, orderId: string, status: OrderStatus) => {
    e.stopPropagation();
    onUpdateStatus(orderId, status);
    setExpandedOrder(null); // Close the window after selection
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmModal({
        isOpen: true,
        title: 'Видалити замовлення',
        message: 'Ви впевнені, що хочете видалити це замовлення? Цю дію неможливо скасувати.',
        isDestructive: true,
        onConfirm: () => {
            onDeleteOrder(id);
            setExpandedOrder(null);
            setConfirmModal(null);
        }
    });
  };

  const startEditingNote = (order: Order) => {
      setEditingNoteId(order.id);
      setNoteText(order.notes || '');
  };

  const saveNote = (id: string) => {
      onUpdateNotes(id, noteText);
      setEditingNoteId(null);
  };

  const startEditingExpenses = (order: Order) => {
      setEditingExpensesId(order.id);
      setExpensesValue(order.expenses?.toString() || '0');
  };

  const saveExpenses = (id: string) => {
      const val = parseFloat(expensesValue);
      if (!isNaN(val)) {
          onUpdateExpenses(id, val);
      }
      setEditingExpensesId(null);
  };

  const startEditingPrepayment = (order: Order) => {
      setEditingPrepaymentId(order.id);
      setPrepaymentValue(order.prepayment?.toString() || '0');
  };

  const savePrepayment = (id: string) => {
      const val = parseFloat(prepaymentValue);
      if (!isNaN(val)) {
          onUpdatePrepayment(id, val);
      }
      setEditingPrepaymentId(null);
  };

  const handleCloseDebt = (order: Order) => {
      setConfirmModal({
          isOpen: true,
          title: 'Закрити борг',
          message: `Закрити борг та встановити оплату ${order.totalAmount.toLocaleString()} грн? Статус зміниться на "Забрав".`,
          onConfirm: () => {
              onUpdatePrepayment(order.id, order.totalAmount);
              // If the status is DEBT, we assume that upon full payment, the order is complete (Picked Up)
              if (order.status === OrderStatus.DEBT) {
                  onUpdateStatus(order.id, OrderStatus.PICKED_UP);
              }
              setConfirmModal(null);
          }
      });
  };

  // Status visual logic
  const isCompleted = (currentStatus: OrderStatus, stepStatus: OrderStatus) => {
    if (currentStatus === OrderStatus.DEBT) return false; 
    if (currentStatus === stepStatus) return true;
    
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const stepIndex = STATUS_FLOW.indexOf(stepStatus);

    if (currentIndex === -1 || stepIndex === -1) return false;
    return currentIndex >= stepIndex;
  };

  const ExpandedContent = ({ order }: { order: Order }) => (
    <div className="bg-gray-50 border-t border-gray-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Items & Finance */}
            <div className="lg:col-span-1">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-1"/> Товари та Оплата
                </h4>
                <ul className="bg-white rounded border border-gray-200 divide-y divide-gray-100 text-sm mb-3">
                    {order.items.map((item, idx) => (
                        <li key={idx} className="p-2 flex justify-between">
                            <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-500 text-xs ml-2">({item.code})</span>
                            </div>
                            <div className="text-gray-600">
                                {item.quantity} x {item.sellPrice} = <b>{item.quantity * item.sellPrice}</b>
                            </div>
                        </li>
                    ))}
                </ul>
                
                {/* Financial Breakdown */}
                <div className="bg-white p-3 rounded border border-gray-200 text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Загальна сума:</span>
                        <span className="font-bold">{order.totalAmount.toLocaleString()} грн</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Метод оплати:</span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                            {order.paymentMethod ? (
                                <>
                                    <PaymentIcon method={order.paymentMethod} />
                                    {paymentMethodLabels[order.paymentMethod]}
                                </>
                            ) : 'Не вказано'}
                        </span>
                    </div>

                    {/* Prepayment / Paid (Editable) */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Сплачено:</span>
                        {editingPrepaymentId === order.id ? (
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    className="w-16 h-6 text-right text-xs border rounded"
                                    value={prepaymentValue}
                                    onChange={e => setPrepaymentValue(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => savePrepayment(order.id)} className="bg-green-600 text-white p-0.5 rounded"><Check className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-1 rounded group" onClick={() => startEditingPrepayment(order)}>
                                    <span>{(order.prepayment || 0).toLocaleString()} грн</span>
                                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 text-gray-500"/>
                            </div>
                        )}
                    </div>

                    {/* Expenses Edit Section */}
                    <div className="flex justify-between items-center text-amber-600 bg-amber-50 -mx-1 px-1 rounded">
                        <span className="flex items-center" title="Супутні витрати (доставка і т.д.)">
                            <Truck className="w-3 h-3 mr-1" /> Витрати:
                        </span>
                        {editingExpensesId === order.id ? (
                            <div className="flex items-center gap-1">
                                <input 
                                    type="number" 
                                    className="w-16 h-6 text-right text-xs border rounded"
                                    value={expensesValue}
                                    onChange={e => setExpensesValue(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => saveExpenses(order.id)} className="bg-green-600 text-white p-0.5 rounded"><Check className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 px-1 rounded" onClick={() => startEditingExpenses(order)}>
                                    <span>{(order.expenses || 0).toLocaleString()} грн</span>
                                    <Pencil className="w-3 h-3 opacity-50"/>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed pt-1 mt-1">
                        <span className="text-gray-800 font-medium">Залишок до сплати:</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${(order.totalAmount - (order.prepayment || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {(order.totalAmount - (order.prepayment || 0)).toLocaleString()} грн
                            </span>
                            {(order.totalAmount - (order.prepayment || 0)) > 0 && (
                                <button 
                                    onClick={() => handleCloseDebt(order)}
                                    className="flex items-center bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded transition"
                                    title="Повністю закрити борг"
                                >
                                    <Wallet className="w-3 h-3 mr-1" />
                                    Закрити борг
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Column 2: Notes */}
            <div className="lg:col-span-1">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-1"/> Примітки
                </h4>
                {editingNoteId === order.id ? (
                    <div className="space-y-2">
                        <textarea 
                            className="w-full border rounded p-2 text-sm h-24"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={() => saveNote(order.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center">
                                <Save className="w-3 h-3 mr-1" /> Зберегти
                            </button>
                            <button onClick={() => setEditingNoteId(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs">
                                Скасувати
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => startEditingNote(order)}
                        className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600 min-h-[60px] cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition"
                    >
                        {order.notes ? order.notes : <span className="text-gray-400 italic">Натисніть, щоб додати примітку...</span>}
                    </div>
                )}
            </div>

            {/* Column 3: Actions / Status Pipeline */}
            <div className="lg:col-span-1">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Check className="w-4 h-4 mr-1"/> Етапи замовлення
                </h4>
                
                {/* Progress Bar Style Status */}
                <div className="space-y-2 bg-white p-3 rounded border border-gray-200">
                    {STATUS_FLOW.map((status, index) => {
                        const completed = isCompleted(order.status, status);
                        const isCurrent = order.status === status;
                        return (
                            <div 
                                key={status}
                                onClick={(e) => handleStatusUpdate(e, order.id, status)}
                                className={`relative flex items-center p-2 rounded cursor-pointer transition ${
                                    completed ? 'text-blue-900 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`mr-3 flex items-center justify-center w-5 h-5 rounded-full border ${
                                    completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}>
                                    {completed && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-sm ${completed ? 'font-bold' : 'font-medium'}`}>
                                    {statusLabels[status]}
                                </span>
                                {/* Connecting Line (except last) */}
                                {index !== STATUS_FLOW.length - 1 && (
                                    <div className={`absolute left-[19px] top-8 h-4 w-0.5 ${
                                        isCompleted(order.status, STATUS_FLOW[index+1]) ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </div>
                        );
                    })}

                    {/* Debt is separated */}
                    <div className="pt-2 mt-2 border-t border-gray-100">
                        <div 
                            onClick={(e) => handleStatusUpdate(e, order.id, OrderStatus.DEBT)}
                            className={`flex items-center p-2 rounded cursor-pointer transition ${
                                order.status === OrderStatus.DEBT ? 'bg-red-50 text-red-800 font-bold' : 'text-gray-500 hover:bg-red-50 hover:text-red-700'
                            }`}
                        >
                                <div className={`mr-3 flex items-center justify-center w-5 h-5 rounded-full border ${
                                    order.status === OrderStatus.DEBT ? 'bg-red-600 border-red-600' : 'border-gray-300'
                                }`}>
                                    {order.status === OrderStatus.DEBT && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm">БОРГ</span>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4 mt-2">
                    <button 
                        onClick={(e) => handleDelete(e, order.id)}
                        className="w-full flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded px-4 py-2 text-sm transition"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Видалити замовлення
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">База замовлень</h2>
        <div className="relative w-full md:w-96">
            <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Пошук по клієнту, телефону, VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {sortedOrders.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow border border-gray-200 text-center text-gray-500">
             Замовлень не знайдено
          </div>
      ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Замовлення</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клієнт</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Авто</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сума</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                                {sortedOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                                                <div className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                {order.notes && (
                                                    <div className="mt-1 flex items-center text-xs text-amber-600">
                                                        <FileText className="w-3 h-3 mr-1" /> Примітка
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{order.customerSnapshot.name}</div>
                                                <div className="text-xs text-gray-500">{order.customerSnapshot.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.vehicleSnapshot ? 
                                                        `${order.vehicleSnapshot.make} ${order.vehicleSnapshot.model}` : 
                                                        `${order.customerSnapshot.make} ${order.customerSnapshot.model}`}
                                                </div>
                                                <div className="text-xs font-mono text-gray-500">
                                                    {order.vehicleSnapshot ? order.vehicleSnapshot.vin : order.customerSnapshot.vin}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{order.totalAmount.toLocaleString()} грн</div>
                                                {order.prepayment > 0 && order.prepayment < order.totalAmount && (
                                                    <div className="text-xs text-red-500 font-medium">
                                                        Борг: {(order.totalAmount - order.prepayment).toLocaleString()}
                                                    </div>
                                                )}
                                                <div className="text-xs text-green-600 mt-0.5" title="Чистий прибуток (з вирахуванням витрат)">Прибуток: {order.totalProfit.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs leading-5 font-bold rounded-full border ${
                                                    order.status === OrderStatus.DEBT 
                                                    ? 'bg-red-100 text-red-800 border-red-200' 
                                                    : order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.PAID
                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                                }`}>
                                                    {statusLabels[order.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    {expandedOrder === order.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedOrder === order.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="p-0">
                                                    <ExpandedContent order={order} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {sortedOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        <div className="p-4 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                        <Calendar className="w-3 h-3 mr-1"/>
                                        {new Date(order.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                                    order.status === OrderStatus.DEBT 
                                    ? 'bg-red-100 text-red-800 border-red-200' 
                                    : order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.PAID
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}>
                                    {statusLabels[order.status]}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                    <div className="text-xs text-gray-500 flex items-center mb-0.5"><User className="w-3 h-3 mr-1"/> Клієнт</div>
                                    <div className="font-medium text-gray-900 truncate">{order.customerSnapshot.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 flex items-center mb-0.5"><Car className="w-3 h-3 mr-1"/> Авто</div>
                                    <div className="font-medium text-gray-900 truncate">
                                        {order.vehicleSnapshot ? order.vehicleSnapshot.model : 'Без авто'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                <div className="font-bold text-lg text-gray-900">
                                    {order.totalAmount.toLocaleString()} грн
                                </div>
                                {order.prepayment > 0 && order.prepayment < order.totalAmount && (
                                     <div className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                        Борг: {(order.totalAmount - order.prepayment).toLocaleString()}
                                     </div>
                                )}
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {expandedOrder === order.id && (
                             <ExpandedContent order={order} />
                        )}
                    </div>
                ))}
            </div>
          </>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${confirmModal.isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
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
                        className={`px-4 py-2 text-white rounded-lg font-bold shadow-lg transition ${
                            confirmModal.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
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
