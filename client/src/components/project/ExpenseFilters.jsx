import { Search, Filter, Layers, Tag } from 'lucide-react';
import { Input } from '../ui';

export default function ExpenseFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  selectedCategory,
  onCategoryChange,
  groupBy,
  onGroupByChange,
  categories = [],
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
      {/* Búsqueda en tiempo real por título */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="relative">
          <Input
            id="expense-search"
            type="text"
            placeholder="Buscar por concepto..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Selectores de filtrado y agrupación */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro: Tipo de gasto */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">Todos</option>
            <option value="shared" className="bg-slate-900">Compartidos</option>
            <option value="personal" className="bg-slate-900">Personales</option>
          </select>
        </div>

        {/* Filtro: Categoría */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="all" className="bg-slate-900">Todas las cat.</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agrupación */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="none" className="bg-slate-900">Sin agrupar</option>
            <option value="date" className="bg-slate-900">Por Día</option>
            <option value="category" className="bg-slate-900">Por Categoría</option>
            <option value="both" className="bg-slate-900">Por Día y Categoría</option>
          </select>
        </div>
      </div>
    </div>
  );
}