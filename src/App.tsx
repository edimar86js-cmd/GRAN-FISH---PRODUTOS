import React, { useState, useMemo, useEffect } from 'react';
import { products, Product } from './data/products';
import { 
  Search, 
  CheckSquare, 
  Square, 
  Download, 
  FileText, 
  Grid, 
  Table as TableIcon, 
  DollarSign, 
  RotateCcw, 
  Filter, 
  Check, 
  Calculator, 
  Info, 
  Image as ImageIcon, 
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateItemPricing, parseStandardWeight, formatCurrency } from './utils/pricing';
import { exportPriceTablePDF, exportCardsPDF } from './utils/pdfExport';

const STORAGE_PRICES_KEY = 'granfish_prices_map_v1';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('ALL');
  const [filterOnlyPriced, setFilterOnlyPriced] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Select all products that have images by default
    const withImages = products
      .filter((p) => p.images && p.images.length > 0)
      .map((p) => p.internalCode);
    return new Set(withImages);
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Price map state (internalCode -> pricePerKg)
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    // Initial suggested prices from products.ts
    const initialMap: Record<string, number> = {};
    products.forEach((p) => {
      if (p.pricePerKg !== undefined) {
        initialMap[p.internalCode] = p.pricePerKg;
      }
    });

    try {
      const saved = localStorage.getItem(STORAGE_PRICES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialMap, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load saved prices', e);
    }
    return initialMap;
  });

  // Save prices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRICES_KEY, JSON.stringify(prices));
    } catch (e) {
      console.error('Failed to save prices', e);
    }
  }, [prices]);

  const handleUpdatePrice = (internalCode: string, newPriceStr: string) => {
    // Allow comma or dot
    const cleanStr = newPriceStr.replace(',', '.').trim();
    if (cleanStr === '') {
      setPrices((prev) => {
        const next = { ...prev };
        delete next[internalCode];
        return next;
      });
      return;
    }
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val >= 0) {
      setPrices((prev) => ({
        ...prev,
        [internalCode]: val
      }));
    }
  };

  const handleConfirmResetPrices = () => {
    const defaultMap: Record<string, number> = {};
    products.forEach((p) => {
      if (p.pricePerKg !== undefined) {
        defaultMap[p.internalCode] = p.pricePerKg;
      }
    });
    setPrices(defaultMap);
    setResetConfirmOpen(false);
    setToast({
      type: 'info',
      message: 'Preços originais restaurados (Cód 1: R$ 9,90, Cód 3: R$ 37,50, Cód 5: R$ 18,50).'
    });
  };

  const speciesList = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.species))).sort();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        p.description.toLowerCase().includes(search) ||
        p.species.toLowerCase().includes(search) ||
        p.internalCode.includes(search) ||
        p.ean13.includes(search) ||
        p.dun14.includes(search) ||
        p.ncm.includes(search);

      const matchesSpecies = selectedSpecies === 'ALL' || p.species === selectedSpecies;
      const hasPrice = prices[p.internalCode] !== undefined && prices[p.internalCode] > 0;
      const matchesPriced = !filterOnlyPriced || hasPrice;

      return matchesSearch && matchesSpecies && matchesPriced;
    });
  }, [searchTerm, selectedSpecies, filterOnlyPriced, prices]);

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.has(p.internalCode));
  }, [selectedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      filteredProducts.forEach((p) => newSet.add(p.internalCode));
      return newSet;
    });
  };

  const selectOnlyWithImages = () => {
    const withImages = products
      .filter((p) => p.images && p.images.length > 0)
      .map((p) => p.internalCode);
    setSelectedIds(new Set(withImages));
    setToast({
      type: 'info',
      message: `${withImages.length} produto(s) com imagem selecionado(s).`
    });
  };

  const productsWithImagesCount = useMemo(() => {
    return products.filter((p) => p.images && p.images.length > 0).length;
  }, []);

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // 1. Export PDF: Tabela de Preços (Official Price List Table)
  const handleExportPriceTablePDF = async () => {
    const itemsToExport = selectedProducts.length > 0 ? selectedProducts : filteredProducts;
    if (itemsToExport.length === 0) {
      setToast({ type: 'error', message: 'Nenhum produto visível para exportar.' });
      return;
    }
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('Gerando Tabela de Preços em PDF...');
    try {
      const success = await exportPriceTablePDF(itemsToExport, prices, (status) => setExportStatus(status));
      if (success) {
        setToast({ type: 'success', message: 'Tabela de Preços em PDF gerada e baixada com sucesso!' });
        setExportModalOpen(false);
      } else {
        setToast({ type: 'error', message: 'Não foi possível baixar o PDF automaticamente no navegador.' });
      }
    } catch (error: any) {
      console.error('Error exporting price table PDF:', error);
      setToast({ type: 'error', message: error?.message || 'Erro ao gerar a Tabela de Preços em PDF.' });
    } finally {
      setIsExporting(false);
      setExportStatus(null);
    }
  };

  // 2. Export PDF: Fichas Técnicas / Cards com Imagens e Preços
  const handleExportCardsPDF = async () => {
    const itemsToExport = selectedProducts.length > 0 ? selectedProducts : filteredProducts;
    if (itemsToExport.length === 0) {
      setToast({ type: 'error', message: 'Nenhum produto selecionado ou visível para exportar.' });
      return;
    }
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('Iniciando geração do catálogo de fichas com fotos...');
    try {
      const success = await exportCardsPDF(itemsToExport, prices, (status) => setExportStatus(status));
      if (success) {
        setToast({ type: 'success', message: 'Catálogo de Fichas em PDF gerado e baixado com sucesso!' });
        setExportModalOpen(false);
      } else {
        setToast({ type: 'error', message: 'Não foi possível baixar o catálogo em PDF.' });
      }
    } catch (error: any) {
      console.error('Error generating Cards PDF:', error);
      setToast({ type: 'error', message: error?.message || 'Erro ao gerar Catálogo em PDF com as fotos.' });
    } finally {
      setIsExporting(false);
      setExportStatus(null);
    }
  };

  // 3. Export CSV/Excel
  const handleExportCSV = () => {
    const items = selectedProducts.length > 0 ? selectedProducts : filteredProducts;
    if (items.length === 0) {
      setToast({ type: 'error', message: 'Nenhum produto visível para exportar.' });
      return;
    }

    try {
      const headers = ['Código', 'Descrição', 'Espécie', 'Peso Pacote / Médio', 'Peso Caixa / Médio', 'Preço por KG', 'Preço por Pacote', 'NCM', 'EAN 13', 'DUN 14'];
      const rows = items.map((p) => {
        const pricePerKg = prices[p.internalCode];
        const pricing = calculateItemPricing(pricePerKg, p.pctWeight, p.description);
        const weightInfo = parseStandardWeight(p.pctWeight, p.description, p.boxWeight);
        return [
          `"${p.internalCode}"`,
          `"${p.description.replace(/"/g, '""')}"`,
          `"${p.species}"`,
          `"${weightInfo.tableLabel}"`,
          `"${weightInfo.boxWeightInfo.tableLabel}"`,
          `"${pricing.pricePerKg ? pricing.formattedPricePerKg : ''}"`,
          `"${pricing.formattedPackagePrice !== '-' ? pricing.formattedPackagePrice : ''}"`,
          `"${p.ncm}"`,
          `"${p.ean13}"`,
          `"${p.dun14}"`
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tabela_precos_gran_fish_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 1500);

      setToast({ type: 'success', message: 'Planilha CSV exportada com sucesso!' });
      setExportModalOpen(false);
    } catch (e: any) {
      console.error('Error exporting CSV', e);
      setToast({ type: 'error', message: 'Erro ao gerar planilha CSV.' });
    }
  };

  const pricedCount = Object.keys(prices).filter((k) => prices[k] > 0).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col md:flex-row antialiased">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center bg-blue-50/50 p-1 rounded-lg border border-blue-100">
              <img 
                src="https://i.ibb.co/KjrvnJf7/logo-png-menor3.png" 
                alt="Gran Fish Logo" 
                className="w-full h-full object-contain drop-shadow-xs" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-800 leading-tight">Gran Fish Pescados</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <DollarSign size={11} className="-mr-0.5" />
                  Tabela de Preço
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Catálogo e Lista de Preços Atacado / Distribuição
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-700 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon size={14} />
                Tabela
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white text-blue-700 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid size={14} />
                Cards
              </button>
            </div>

            {/* Export Actions in Header */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPriceTablePDF}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Exportar Tabela de Preços Oficial em PDF diretamente"
              >
                {isExporting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                <span>{isExporting ? 'Gerando...' : 'Exportar PDF'}</span>
              </button>

              <button
                onClick={() => setExportModalOpen(true)}
                disabled={isExporting}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-2.5 py-2 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title="Mais opções de exportação (Catálogo com Fotos e Planilha CSV)"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Opções</span>
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar & Filters */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex flex-col gap-3">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por descrição, código, espécie, NCM ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Actions & Price Count */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => setFilterOnlyPriced(!filterOnlyPriced)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  filterOnlyPriced 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <DollarSign size={13} />
                <span>Apenas com Preço ({pricedCount})</span>
              </button>

              <button
                onClick={selectOnlyWithImages}
                className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Deixar marcados e assinalados todos os produtos que possuem foto cadastrada"
              >
                <ImageIcon size={13} className="text-blue-600" />
                <span>Marcar com Imagem ({productsWithImagesCount})</span>
              </button>

              <button
                onClick={selectAllFiltered}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                title="Selecionar todos os itens visíveis"
              >
                Selecionar Todos ({filteredProducts.length})
              </button>

              {selectedIds.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                >
                  Limpar ({selectedIds.size})
                </button>
              )}

              <button
                onClick={() => setResetConfirmOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Restaurar preços originais (Cód 1, 3 e 5)"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Species Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
              <Filter size={12} /> Espécie:
            </span>
            <button
              onClick={() => setSelectedSpecies('ALL')}
              className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${
                selectedSpecies === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({products.length})
            </button>
            {speciesList.map((sp) => {
              const count = products.filter((p) => p.species === sp).length;
              return (
                <button
                  key={sp}
                  onClick={() => setSelectedSpecies(sp)}
                  className={`px-2.5 py-1 rounded-md shrink-0 transition-colors cursor-pointer ${
                    selectedSpecies === sp
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sp} ({count})
                </button>
              );
            })}
          </div>

        </div>

        {/* Pricing conversion notification / banner */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-2 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Calculator size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Conversão & Pesos:</strong> Pacotes industriais com <strong>400g</strong>, <strong>600g</strong> ou <strong>800g</strong> na descrição são convertidos em preço/pacote com peso fixo. Produtos de <strong>peso variável</strong> exibem o sinal aproximado <strong>~</strong> com a <strong>média</strong> em kg no peso do pacote e no peso da caixa (Preço/Pct com <strong>-</strong>).
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-medium">
            Clique no campo Preço/KG para editar
          </span>
        </div>

        {/* Product Table View */}
        {viewMode === 'table' ? (
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold tracking-wide uppercase text-[11px]">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">Sel.</th>
                      <th className="px-3 py-3 w-14 text-center">Cód.</th>
                      <th className="px-2 py-3 w-20 text-center">Foto</th>
                      <th className="px-3 py-3 min-w-[260px]">Descrição do Produto</th>
                      <th className="px-3 py-3">Espécie</th>
                      <th className="px-3 py-3 text-center" title="Peso individual/pacote (com ~ média para produtos de peso variável)">Peso Pct</th>
                      <th className="px-3 py-3 text-center" title="Peso da caixa fechada (com ~ média para produtos de peso variável)">Peso Caixa</th>
                      <th className="px-3 py-3 bg-blue-50/50 text-blue-900 text-right min-w-[130px]">
                        Preço / KG (R$)
                      </th>
                      <th className="px-3 py-3 bg-emerald-50/50 text-emerald-900 text-right min-w-[140px]">
                        Preço / Pacote (R$)
                      </th>
                      <th className="px-3 py-3 text-center">NCM</th>
                      <th className="px-3 py-3">EAN 13 / DUN 14</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedIds.has(product.internalCode);
                      const currentPrice = prices[product.internalCode];
                      const pricing = calculateItemPricing(currentPrice, product.pctWeight, product.description);
                      const weightInfo = parseStandardWeight(product.pctWeight, product.description, product.boxWeight);

                      return (
                        <tr
                          key={product.internalCode}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            isSelected ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleSelection(product.internalCode)}
                              className="text-slate-400 hover:text-blue-600 focus:outline-none transition-colors cursor-pointer"
                              title={isSelected ? 'Desmarcar' : 'Selecionar'}
                            >
                              {isSelected ? (
                                <CheckSquare className="text-blue-600" size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>

                          {/* Code */}
                          <td className="px-3 py-2 text-center font-bold font-mono text-blue-700 bg-slate-50/50">
                            {product.internalCode}
                          </td>

                          {/* Thumbnail / Photo (+60% larger: 64px x 64px, object-contain so image is never cropped) */}
                          <td className="px-2 py-2 text-center">
                            {product.images && product.images.length > 0 ? (
                              <button
                                onClick={() => setPreviewImage(product.images![0])}
                                className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white hover:ring-2 hover:ring-blue-500 hover:border-transparent transition-all inline-flex items-center justify-center cursor-pointer shadow-xs group relative shrink-0 p-1"
                                title="Clique para ampliar a foto do produto (sem cortes)"
                              >
                                <img
                                  src={product.images[0]}
                                  alt={product.description}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
                                  loading="lazy"
                                />
                                <span className="absolute bottom-0.5 right-0.5 bg-slate-900/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Search size={10} />
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">-</span>
                            )}
                          </td>

                          {/* Description */}
                          <td className="px-3 py-2 font-medium text-slate-800 whitespace-normal">
                            <div className="flex items-center gap-1.5">
                              <span>{product.description}</span>
                              {product.images && product.images.length > 1 && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  {product.images.length} fotos
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Species */}
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {product.species}
                            </span>
                          </td>

                          {/* Package Weight (Standard vs Variable) */}
                          <td className="px-3 py-2 text-center">
                            {weightInfo.isStandard ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-semibold border border-sky-200 font-mono text-[11px]"
                                title={`Peso fixo padrão industrial: ${weightInfo.standardGrams}g (${weightInfo.tableLabel})`}
                              >
                                {weightInfo.tableLabel}
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200/80 font-mono text-[11px]"
                                title="Produto de peso variável sob pesagem (média aproximada)"
                              >
                                {weightInfo.tableLabel}
                              </span>
                            )}
                          </td>

                          {/* Box Weight */}
                          <td className="px-3 py-2 text-center text-slate-600 font-medium">
                            {weightInfo.isVariable ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200/80 font-mono text-[11px]"
                                title="Peso da caixa aproximado / médio (produto com peso variável sob pesagem)"
                              >
                                {weightInfo.boxWeightInfo.tableLabel}
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-semibold border border-sky-200 font-mono text-[11px]"
                                title="Peso fixo padrão da caixa"
                              >
                                {weightInfo.boxWeightInfo.tableLabel}
                              </span>
                            )}
                          </td>

                          {/* Price Per KG (Editable with instant live conversion) */}
                          <td className="px-3 py-2 bg-blue-50/30 text-right">
                            <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-2xs">
                              <span className="text-slate-400 font-semibold text-[11px]">R$</span>
                              <input
                                type="text"
                                defaultValue={currentPrice !== undefined ? currentPrice.toFixed(2).replace('.', ',') : ''}
                                key={`price-${product.internalCode}-${currentPrice}`}
                                placeholder="0,00"
                                onChange={(e) => {
                                  const val = e.target.value.replace(',', '.').trim();
                                  if (val === '') {
                                    handleUpdatePrice(product.internalCode, '');
                                  } else {
                                    const num = parseFloat(val);
                                    if (!isNaN(num) && num >= 0) {
                                      setPrices((prev) => ({ ...prev, [product.internalCode]: num }));
                                    }
                                  }
                                }}
                                onBlur={(e) => handleUpdatePrice(product.internalCode, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdatePrice(product.internalCode, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-16 text-right font-mono font-bold text-slate-800 focus:outline-none text-xs"
                              />
                            </div>
                          </td>

                          {/* Price Per Package (Converted for 400g, 600g, 800g) */}
                          <td className="px-3 py-2 bg-emerald-50/30 text-right">
                            {pricing.isStandardWeight ? (
                              pricing.packagePrice !== null ? (
                                <div className="flex flex-col items-end">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold font-mono text-xs shadow-2xs">
                                    {pricing.formattedPackagePrice}
                                  </span>
                                  <span className="text-[10px] text-emerald-800 font-medium mt-0.5" title={pricing.calculationFormula}>
                                    {pricing.weightInKg}kg ({pricing.standardGrams}g) × {pricing.formattedPricePerKg}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 font-medium border border-amber-200">
                                  A definir
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 font-mono text-xs font-medium">-</span>
                            )}
                          </td>

                          {/* NCM */}
                          <td className="px-3 py-2 text-center text-slate-600 font-mono text-[11px]">
                            {product.ncm || '-'}
                          </td>

                          {/* EAN 13 / DUN 14 */}
                          <td className="px-3 py-2 text-slate-500 text-[11px] font-mono">
                            <div>EAN: {product.ean13 || '-'}</div>
                            {product.dun14 && product.dun14 !== '#N/D' && (
                              <div className="text-[10px] text-slate-400">DUN: {product.dun14}</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                          Nenhum produto encontrado com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Cards View Mode */
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.internalCode);
                const currentPrice = prices[product.internalCode];
                const pricing = calculateItemPricing(currentPrice, product.pctWeight, product.description);
                const weightInfo = parseStandardWeight(product.pctWeight, product.description, product.boxWeight);

                return (
                  <div
                    key={product.internalCode}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all relative flex flex-col justify-between ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          CÓD. {product.internalCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {product.species}
                          </span>
                          <button
                            onClick={() => toggleSelection(product.internalCode)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          >
                            {isSelected ? <CheckSquare className="text-blue-600" size={18} /> : <Square size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <h3 className="font-bold text-slate-800 text-sm mb-3 leading-snug">
                        {product.description}
                      </h3>

                      {/* Product Images (+60% larger: 104px x 104px, object-contain without cropping) */}
                      {product.images && product.images.length > 0 && (
                        <div className="mb-3 flex gap-2.5 overflow-x-auto pb-1">
                          {product.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewImage(img)}
                              className="w-[104px] h-[104px] rounded-xl overflow-hidden border border-slate-200 shrink-0 hover:ring-2 hover:ring-blue-500 hover:opacity-95 transition-all shadow-xs group relative bg-white p-1.5"
                              title="Clique para ampliar foto completa"
                            >
                              <img src={img} alt={product.description} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150" />
                              <span className="absolute bottom-1 right-1 bg-slate-900/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Search size={12} />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pricing Highlight Box */}
                      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-3 border border-blue-100/80 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blue-900 block">Preço / KG</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono font-bold text-blue-800 text-sm">
                                {pricing.pricePerKg ? pricing.formattedPricePerKg : 'Sob consulta'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-900 block">Preço / Pacote</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                              {pricing.formattedPackagePrice}
                            </span>
                          </div>
                        </div>
                        {pricing.isStandardWeight && pricing.packagePrice && (
                          <div className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200/60 text-center">
                            Conversão: {pricing.calculationFormula}
                          </div>
                        )}
                      </div>

                      {/* Technical Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">
                            {weightInfo.isStandard ? 'Peso Pacote (Padrão)' : 'Peso Médio (Aprox.)'}
                          </span>
                          <span className={`font-semibold ${weightInfo.isStandard ? 'text-sky-800' : 'text-amber-900'}`}>
                            {weightInfo.displayLabel}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">
                            {weightInfo.isStandard ? 'Peso Caixa (Padrão)' : 'Peso Caixa (Aprox./Méd.)'}
                          </span>
                          <span className={`font-semibold ${weightInfo.isStandard ? 'text-slate-700' : 'text-amber-900'}`}>
                            {weightInfo.boxWeightInfo.displayLabel}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">NCM</span>
                          <span className="font-mono text-slate-700">{product.ncm || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">EAN 13</span>
                          <span className="font-mono text-slate-700 text-[11px] truncate block">{product.ean13}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Sidebar: Selection & Pricing Summary */}
      <div className="w-full md:w-84 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-screen shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-800">Itens Selecionados</h2>
            <p className="text-xs text-slate-500">Prontos para exportação ou cotação</p>
          </div>
          <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full text-xs shadow-xs">
            {selectedIds.size}
          </span>
        </div>
        
        {/* Selected List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <AnimatePresence>
            {selectedProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <CheckSquare size={24} className="text-slate-400 stroke-1" />
                </div>
                <h4 className="text-slate-700 font-semibold text-sm mb-1">Nenhum item selecionado</h4>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Marque as caixas de seleção na tabela para calcular preços e exportar o relatório.
                </p>
                <button
                  onClick={selectAllFiltered}
                  className="mt-4 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Selecionar {filteredProducts.length} itens visíveis
                </button>
              </motion.div>
            ) : (
              selectedProducts.map((product) => {
                const currentPrice = prices[product.internalCode];
                const pricing = calculateItemPricing(currentPrice, product.pctWeight, product.description);
                const weightInfo = parseStandardWeight(product.pctWeight, product.description, product.boxWeight);

                return (
                  <motion.div
                    key={product.internalCode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs relative group hover:border-blue-300 transition-all"
                  >
                    {/* Remove button */}
                    <button 
                      onClick={() => toggleSelection(product.internalCode)}
                      className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remover da seleção"
                    >
                      <X size={16} />
                    </button>

                    {/* Code & Species */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold text-blue-600">
                        CÓD. {product.internalCode}
                      </span>
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {product.species}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-800 leading-snug pr-5 mb-2">
                      {product.description}
                    </h3>

                    {/* Pricing Box inside item */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Preço / KG:</span>
                        <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
                          <span className="text-slate-400 font-semibold text-[10px]">R$</span>
                          <input
                            type="text"
                            defaultValue={currentPrice !== undefined ? currentPrice.toFixed(2).replace('.', ',') : ''}
                            key={`sidebar-price-${product.internalCode}-${currentPrice}`}
                            placeholder="0,00"
                            onBlur={(e) => handleUpdatePrice(product.internalCode, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdatePrice(product.internalCode, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-14 text-right font-mono font-bold text-slate-800 focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Preço / Pacote:</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                          {pricing.formattedPackagePrice}
                        </span>
                      </div>

                      {pricing.isStandardWeight && pricing.packagePrice && (
                        <div className="text-[10px] text-slate-500 mt-1 text-right">
                          {pricing.weightInKg}kg ({pricing.standardGrams}g) × {pricing.formattedPricePerKg}
                        </div>
                      )}
                    </div>

                    {/* Specs badges */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Pct: <strong className="text-slate-700">{weightInfo.tableLabel}</strong></span>
                      <span>Cx: <strong className="text-slate-700">{weightInfo.boxWeightInfo.tableLabel}</strong></span>
                      <span>NCM: <strong className="text-slate-700">{product.ncm || '-'}</strong></span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          <button
            onClick={() => setExportModalOpen(true)}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} />
            <span>Exportar Relatório / Tabela ({selectedIds.size > 0 ? selectedIds.size : filteredProducts.length})</span>
          </button>
        </div>

      </div>

      {/* Export Options Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Opções de Exportação</h3>
                  <p className="text-xs text-slate-500">
                    {selectedProducts.length > 0 
                      ? `${selectedProducts.length} itens selecionados` 
                      : `Todos os ${filteredProducts.length} itens visíveis`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Active Export Status Banner */}
              {isExporting && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 text-xs animate-pulse">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-semibold">{exportStatus || 'Gerando documento... Por favor aguarde.'}</span>
                </div>
              )}

              {/* Option 1: Official Price Table PDF */}
              <button
                onClick={handleExportPriceTablePDF}
                disabled={isExporting}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-xs group-hover:text-blue-700">
                      Tabela de Preços Oficial (PDF)
                    </h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      Rápido
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Layout tabular comercial com logotipo oficial da Gran Fish, Preço/KG, Preço/Pct convertido, pesos e NCM.
                  </p>
                </div>
              </button>

              {/* Option 2: Cards with Images */}
              <button
                onClick={handleExportCardsPDF}
                disabled={isExporting}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Grid size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs group-hover:text-indigo-700">
                    Catálogo / Fichas com Fotos (PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Formato de cards visuais com fotos reais dos produtos, preços destacados e dados técnicos completos.
                  </p>
                </div>
              </button>

              {/* Option 3: Excel / CSV */}
              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs group-hover:text-emerald-700">
                    Planilha Excel / CSV
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Exporta todos os dados e valores calculados em formato de planilha compatível com Microsoft Excel.
                  </p>
                </div>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setExportModalOpen(false)}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer disabled:opacity-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Restaurar Preços?</h3>
                <p className="text-xs text-slate-500">Isso voltará aos valores sugeridos padrão.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Os preços dos itens <strong>Cód 1 (R$ 9,90)</strong>, <strong>Cód 3 (R$ 37,50)</strong> e <strong>Cód 5 (R$ 18,50)</strong> serão reaplicados.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetPrices}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-medium max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 right-5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-2 transition-colors z-10 cursor-pointer shadow-lg"
            >
              <X size={22} />
            </button>
            <img
              src={previewImage}
              alt="Visualização do produto"
              className="max-h-[85vh] w-auto object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}

    </div>
  );
}
