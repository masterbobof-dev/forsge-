
import React, { useState, useMemo, useRef } from 'react';
import { Product, MARKUP_OPTIONS } from '../types';
import * as XLSX from 'xlsx';
import { Search, Edit2, Trash2, Save, X, Package, Plus, UploadCloud, FileSpreadsheet, Percent, CheckSquare, Square, Calculator, AlertTriangle, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';

interface Props {
  products: Product[];
  onCreate: (product: Product) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  onBulkCreate: (products: Product[]) => void;
  onBulkUpdate: (products: Product[]) => void;
}

type BulkUpdateType = 'MARKUP_ON_BUY' | 'CHANGE_CURRENT';

export const ProductsView: React.FC<Props> = ({ products, onCreate, onUpdate, onDelete, onBulkCreate, onBulkUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkPercent, setBulkPercent] = useState<string>('');
  const [bulkActionType, setBulkActionType] = useState<BulkUpdateType>('MARKUP_ON_BUY');

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<any[][]>([]);
  const [importFilename, setImportFilename] = useState('');
  const [mapping, setMapping] = useState({
      code: 0,
      brand: 1,
      name: 2,
      buyPrice: 3,
      sellPrice: 4,
      startRow: 2 // User sees row numbers, internally index = startRow - 1
  });

  // Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [notificationModal, setNotificationModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
  } | null>(null);

  // Create Form State
  const [newProductForm, setNewProductForm] = useState({
    code: '',
    brand: '',
    name: '',
    buyPrice: '',
    sellPrice: ''
  });

  // Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.code.toLowerCase().includes(lower) ||
      (p.brand && p.brand.toLowerCase().includes(lower))
    );
  }, [products, searchTerm]);

  // --- Selection Handlers ---

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(bulkPercent);
    if (isNaN(percent)) return;

    const productsToUpdate: Product[] = [];
    
    // Find selected products
    products.forEach(p => {
        if (selectedIds.has(p.id)) {
            let newSellPrice = p.sellPrice;
            if (bulkActionType === 'MARKUP_ON_BUY') {
                newSellPrice = p.buyPrice + (p.buyPrice * (percent / 100));
            } else {
                newSellPrice = p.sellPrice + (p.sellPrice * (percent / 100));
            }
            
            productsToUpdate.push({
                ...p,
                sellPrice: Math.round(newSellPrice) 
            });
        }
    });

    onBulkUpdate(productsToUpdate);
    setNotificationModal({
        isOpen: true,
        title: 'Успішно',
        message: `Оновлено ціни для ${productsToUpdate.length} товарів.`
    });
    setIsBulkUpdating(false);
    setSelectedIds(new Set());
    setBulkPercent('');
  };

  // --- Import Handlers ---

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFilename(file.name);
    
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    setImportData(jsonData);
  };

  const handleImportSubmit = () => {
      const productsToAdd: Product[] = [];
      const startIndex = Math.max(0, mapping.startRow - 1);
      
      for(let i = startIndex; i < importData.length; i++) {
          const row = importData[i];
          if (!row || row.length === 0) continue;
          
          const buyPrice = parseFloat(String(row[mapping.buyPrice] || '0').replace(/[^0-9.]/g, '')) || 0;
          let sellPrice = parseFloat(String(row[mapping.sellPrice] || '0').replace(/[^0-9.]/g, '')) || 0;
          
          // Fallback logic: If sell price is 0 (missing data), default to buy price
          if (sellPrice === 0 && buyPrice > 0) {
              sellPrice = buyPrice;
          }
          
          const p: Product = {
              id: crypto.randomUUID(),
              code: String(row[mapping.code] || '').trim(),
              brand: String(row[mapping.brand] || '').trim(),
              name: String(row[mapping.name] || '').trim(),
              buyPrice: buyPrice,
              sellPrice: sellPrice,
          };
          
          if (p.name) {
             productsToAdd.push(p);
          }
      }
      
      onBulkCreate(productsToAdd);
      setIsImporting(false);
      setImportData([]);
      setImportFilename('');
      setNotificationModal({
          isOpen: true,
          title: 'Імпорт завершено',
          message: `Оброблено ${productsToAdd.length} записів.`
      });
  };

  const getExcelColumns = () => {
      if (importData.length === 0) return [];
      const maxCols = importData[0].length;
      return Array.from({length: maxCols}, (_, i) => {
          // Convert 0 -> A, 1 -> B, etc.
          let label = '';
          let n = i;
          while (n >= 0) {
              label = String.fromCharCode((n % 26) + 65) + label;
              n = Math.floor(n / 26) - 1;
          }
          return { index: i, label };
      });
  };

  // --- Handlers for Creating ---

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
        id: crypto.randomUUID(),
        code: newProductForm.code,
        brand: newProductForm.brand,
        name: newProductForm.name,
        buyPrice: parseFloat(newProductForm.buyPrice) || 0,
        sellPrice: parseFloat(newProductForm.sellPrice) || 0
    };
    onCreate(newProduct);
    setIsCreating(false);
    setNewProductForm({ code: '', brand: '', name: '', buyPrice: '', sellPrice: '' });
  };

  // --- Handlers for Editing ---

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdate(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const { name, value } = e.target;
    
    setEditForm(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name.includes('Price') ? parseFloat(value) || 0 : value
      };
    });
  };

  const handleInlineMarkup = (percent: number) => {
      if (!editForm) return;
      const buy = editForm.buyPrice;
      const sell = buy + (buy * (percent / 100));
      setEditForm(prev => prev ? ({ ...prev, sellPrice: Math.round(sell) }) : null);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Видалити товар',
        message: 'Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати.',
        onConfirm: () => {
            onDelete(id);
            setConfirmModal(null);
        }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600"/>
            Каталог
        </h2>
        <div className="flex gap-2 w-full md:w-auto items-center">
             
             {/* Bulk Action Button */}
             <div className="relative">
                 <button 
                    disabled={selectedIds.size === 0}
                    onClick={() => setIsBulkUpdating(true)}
                    className="flex items-center justify-center px-3 md:px-4 py-2 rounded-md font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                    title="Змінити ціну для вибраних"
                 >
                    <Percent className="w-5 h-5 mr-1" />
                    <span className="hidden md:inline">Націнка</span>
                    {selectedIds.size > 0 && <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 rounded-full">{selectedIds.size}</span>}
                 </button>
             </div>

             <button 
                onClick={() => setIsImporting(true)}
                className="flex items-center justify-center px-3 md:px-4 py-2 rounded-md font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition mr-2"
                title="Імпорт з Excel"
             >
                <UploadCloud className="w-5 h-5" />
             </button>

             <div className="relative flex-grow md:w-80">
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Пошук..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <button 
                onClick={() => setIsCreating(!isCreating)}
                className={`flex items-center justify-center px-4 py-2 rounded-md font-bold text-white transition ${
                    isCreating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {isCreating ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {isBulkUpdating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center">
                          <Percent className="w-6 h-6 mr-2 text-blue-600" /> Масова зміна цін
                      </h3>
                      <button onClick={() => setIsBulkUpdating(false)}><X className="w-6 h-6 text-gray-400"/></button>
                  </div>
                  
                  <form onSubmit={handleBulkUpdateSubmit}>
                      <p className="text-sm text-gray-600 mb-4">
                          Вибрано товарів: <span className="font-bold">{selectedIds.size}</span>
                      </p>

                      <div className="space-y-3 mb-6">
                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition">
                              <input 
                                type="radio" 
                                name="type" 
                                checked={bulkActionType === 'MARKUP_ON_BUY'} 
                                onChange={() => setBulkActionType('MARKUP_ON_BUY')}
                                className="w-5 h-5 text-blue-600"
                              />
                              <div className="ml-3">
                                  <span className="block font-bold text-gray-800">Націнка від закупки</span>
                                  <span className="block text-xs text-gray-500">Ціна Продажу = Закуп + %</span>
                              </div>
                          </label>

                          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition">
                              <input 
                                type="radio" 
                                name="type" 
                                checked={bulkActionType === 'CHANGE_CURRENT'} 
                                onChange={() => setBulkActionType('CHANGE_CURRENT')}
                                className="w-5 h-5 text-blue-600"
                              />
                              <div className="ml-3">
                                  <span className="block font-bold text-gray-800">Змінити поточну ціну</span>
                                  <span className="block text-xs text-gray-500">Ціна Продажу = Поточна + %</span>
                              </div>
                          </label>
                      </div>

                      <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Відсоток (%)</label>
                          <input 
                              type="number" 
                              required
                              value={bulkPercent}
                              onChange={(e) => setBulkPercent(e.target.value)}
                              className="w-full border-2 border-blue-500 rounded-lg p-3 text-lg font-bold"
                              placeholder="Наприклад: 20 або -10"
                          />
                          <p className="text-xs text-gray-500 mt-1">Використовуйте мінус для знижки (напр. -10)</p>
                      </div>

                      <div className="flex gap-3">
                          <button type="button" onClick={() => setIsBulkUpdating(false)} className="w-1/3 py-3 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Скасувати</button>
                          <button type="submit" className="w-2/3 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">Застосувати</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Import Modal */}
      {isImporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center text-gray-800">
                          <FileSpreadsheet className="w-6 h-6 mr-2 text-green-600" />
                          Імпорт товарів з Excel
                      </h3>
                      <button onClick={() => {setIsImporting(false); setImportData([]);}}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {importData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                              <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
                              <p className="text-lg font-medium text-gray-600 mb-2">Завантажте файл .xlsx або .xls</p>
                              <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden" 
                                id="file-upload"
                              />
                              <label htmlFor="file-upload" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition shadow">
                                  Обрати файл
                              </label>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex flex-wrap gap-6 items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Файл</label>
                                      <div className="font-medium text-gray-900">{importFilename}</div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Почати з рядка</label>
                                      <input 
                                        type="number" 
                                        min="1" 
                                        value={mapping.startRow}
                                        onChange={(e) => setMapping(prev => ({...prev, startRow: parseInt(e.target.value) || 1}))}
                                        className="w-20 border rounded px-2 py-1 text-sm font-bold"
                                      />
                                  </div>
                                  <div className="text-sm text-gray-500 italic flex items-center">
                                      <AlertTriangle className="w-4 h-4 mr-1 text-orange-500"/>
                                      Перевірте відповідність стовпчиків нижче
                                  </div>
                              </div>

                              <div className="overflow-x-auto border rounded-lg">
                                  <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-100">
                                          <tr>
                                              <th className="w-12 px-4 py-2 text-center text-xs font-bold text-gray-500">#</th>
                                              {getExcelColumns().map(col => (
                                                  <th key={col.index} className="px-4 py-2 min-w-[150px]">
                                                      <div className="text-xs font-bold text-center text-gray-400 mb-1">Стовпчик {col.label}</div>
                                                      <select 
                                                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        value={
                                                            mapping.code === col.index ? 'code' :
                                                            mapping.brand === col.index ? 'brand' :
                                                            mapping.name === col.index ? 'name' :
                                                            mapping.buyPrice === col.index ? 'buyPrice' :
                                                            mapping.sellPrice === col.index ? 'sellPrice' : ''
                                                        }
                                                        onChange={(e) => {
                                                            const field = e.target.value;
                                                            // Logic to clear old mapping if needed and set new
                                                            const existingField = Object.keys(mapping).find(k => k !== 'startRow' && (mapping as any)[k] === col.index);
                                                            
                                                            setMapping(prev => {
                                                                const next = { ...prev };
                                                                if (existingField) {
                                                                    (next as any)[existingField] = -1;
                                                                }
                                                                if (field) {
                                                                    (next as any)[field] = col.index;
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                      >
                                                          <option value="">- Пропустити -</option>
                                                          <option value="code">Код товару</option>
                                                          <option value="brand">Бренд</option>
                                                          <option value="name">Найменування</option>
                                                          <option value="buyPrice">Ціна закупівлі</option>
                                                          <option value="sellPrice">Ціна продажу</option>
                                                      </select>
                                                  </th>
                                              ))}
                                          </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                          {importData.slice(0, 5).map((row, rIdx) => (
                                              <tr key={rIdx} className={rIdx + 1 < mapping.startRow ? 'opacity-40 bg-gray-50' : ''}>
                                                  <td className="px-4 py-2 text-center font-mono text-xs text-gray-400 bg-gray-50">{rIdx + 1}</td>
                                                  {getExcelColumns().map(col => (
                                                      <td key={col.index} className="px-4 py-2 truncate max-w-[200px] border-l border-gray-100">
                                                          {row[col.index]}
                                                      </td>
                                                  ))}
                                              </tr>
                                          ))}
                                          {importData.length > 5 && (
                                              <tr>
                                                  <td colSpan={getExcelColumns().length + 1} className="px-4 py-2 text-center text-xs text-gray-400 italic bg-gray-50">
                                                      ... ще {importData.length - 5} рядків ...
                                                  </td>
                                              </tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                      <button 
                        onClick={() => {setIsImporting(false); setImportData([]);}}
                        className="px-6 py-2 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition"
                      >
                          Скасувати
                      </button>
                      <button 
                        disabled={importData.length === 0}
                        onClick={handleImportSubmit}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                          <Save className="w-4 h-4 mr-2" />
                          Імпортувати дані
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200 animate-slide-in-top">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-600" /> Додати новий товар
            </h3>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Код</label>
                    <input required name="code" value={newProductForm.code} onChange={handleCreateChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" placeholder="A001"/>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Бренд</label>
                    <input name="brand" value={newProductForm.brand} onChange={handleCreateChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" placeholder="Bosch"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Найменування</label>
                    <input required name="name" value={newProductForm.name} onChange={handleCreateChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" placeholder="Назва"/>
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Закуп (грн)</label>
                    <input type="number" name="buyPrice" value={newProductForm.buyPrice} onChange={handleCreateChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" placeholder="0"/>
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Продаж (грн)</label>
                    <input required type="number" name="sellPrice" value={newProductForm.sellPrice} onChange={handleCreateChange} className="w-full border rounded p-2 font-bold focus:ring-2 focus:ring-green-500" placeholder="0"/>
                </div>
                <div className="md:col-span-6 flex justify-end mt-2">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition">
                        Зберегти товар
                    </button>
                </div>
            </form>
        </div>
      )}

      {filteredProducts.length === 0 ? (
           <div className="px-6 py-10 text-center text-gray-500 bg-white border border-dashed rounded-lg">
                Товарів не знайдено
           </div>
      ) : (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <button onClick={toggleSelectAll} className="flex items-center text-gray-500 hover:text-blue-600">
                                        {selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Код</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Бренд</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Найменування</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Закупівля</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Продаж</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map(product => {
                                    const isEditing = editingId === product.id;
                                    const isSelected = selectedIds.has(product.id);
                                    
                                    return (
                                        <tr key={product.id} className={`${isEditing ? "bg-blue-50" : "hover:bg-gray-50"} ${isSelected ? "bg-blue-50/50" : ""}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => toggleSelectRow(product.id)} className="text-gray-400 hover:text-blue-600">
                                                    {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isEditing ? (
                                                    <input name="code" value={editForm?.code} onChange={handleEditChange} className="w-full border rounded px-2 py-1 text-sm"/>
                                                ) : (
                                                    <span className="text-sm font-mono text-gray-500">{product.code}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isEditing ? (
                                                    <input name="brand" value={editForm?.brand || ''} onChange={handleEditChange} className="w-full border rounded px-2 py-1 text-sm"/>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-600">{product.brand || '-'}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input name="name" value={editForm?.name} onChange={handleEditChange} className="w-full border rounded px-2 py-1 text-sm"/>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isEditing ? (
                                                    <input type="number" name="buyPrice" value={editForm?.buyPrice} onChange={handleEditChange} className="w-20 border rounded px-2 py-1 text-sm"/>
                                                ) : (
                                                    <span className="text-sm text-gray-500">{product.buyPrice}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1">
                                                        <input type="number" name="sellPrice" value={editForm?.sellPrice} onChange={handleEditChange} className="w-24 border rounded px-2 py-1 text-sm font-bold"/>
                                                        <div className="flex gap-1 flex-wrap w-32">
                                                            {[10, 20, 30, 50].map(p => (
                                                                <button key={p} onClick={() => handleInlineMarkup(p)} className="text-[10px] px-1 bg-white border rounded hover:bg-gray-100">+{p}%</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-900">{product.sellPrice}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {isEditing ? (
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900"><Save className="w-5 h-5" /></button>
                                                        <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end space-x-3">
                                                        <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDeleteClick(product.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredProducts.map(product => {
                    const isEditing = editingId === product.id;
                    const isSelected = selectedIds.has(product.id);
                    
                    return (
                        <div key={product.id} className={`bg-white rounded-lg shadow border p-4 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input name="code" value={editForm?.code} onChange={handleEditChange} className="w-full border rounded p-2 text-sm" placeholder="Код"/>
                                    <input name="brand" value={editForm?.brand || ''} onChange={handleEditChange} className="w-full border rounded p-2 text-sm" placeholder="Бренд"/>
                                    <input name="name" value={editForm?.name} onChange={handleEditChange} className="w-full border rounded p-2 text-sm" placeholder="Назва"/>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" name="buyPrice" value={editForm?.buyPrice} onChange={handleEditChange} className="border rounded p-2 text-sm" placeholder="Закуп"/>
                                        <input type="number" name="sellPrice" value={editForm?.sellPrice} onChange={handleEditChange} className="border rounded p-2 text-sm font-bold" placeholder="Продаж"/>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                         <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-100 rounded text-sm">Скасувати</button>
                                         <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Зберегти</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleSelectRow(product.id)} className="text-gray-400 hover:text-blue-600">
                                                {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                            </button>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{product.code}</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-lg">{product.sellPrice} грн</div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        {product.brand && <div className="text-xs font-bold text-gray-500 uppercase">{product.brand}</div>}
                                        <div className="text-gray-800 font-medium">{product.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">Закуп: {product.buyPrice} грн</div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">
                                        <button onClick={() => handleEditClick(product)} className="flex items-center text-blue-600 text-sm"><Edit2 className="w-4 h-4 mr-1" /> Ред.</button>
                                        <button onClick={() => handleDeleteClick(product.id)} className="flex items-center text-red-500 text-sm"><Trash2 className="w-4 h-4 mr-1" /> Видал.</button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
      )}

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

         {/* Notification Modal */}
         {notificationModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{notificationModal.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{notificationModal.message}</p>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setNotificationModal(null)} 
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
                        >
                            ОК
                        </button>
                    </div>
                </div>
            </div>
         )}
    </div>
  );
};
