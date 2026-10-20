import { useState, useMemo } from 'react';
import { Receipt, Filter, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import ExpenseItem from './ExpenseItem';
import ExpenseFilters from './ExpenseFilters';

export default function ExpenseList({
  expenses = [],
  project,
  currentUser,
  isMe,
  getMyShareForExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [groupBy, setGroupBy] = useState('date');

  const todayStr = useMemo(() => new Date().toLocaleDateString(), []);
  const [openAccordions, setOpenAccordions] = useState({ [todayStr]: true });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Obtener categorías únicas presentes en la lista de gastos
  const availableCategories = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  // Filtrado compuesto: tipo + categoría + búsqueda por concepto
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (filterType === 'shared' && exp.isPersonal) return false;
      if (filterType === 'personal' && !exp.isPersonal) return false;

      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(term);
        const matchesPayer = exp.paidBy?.name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesPayer) return false;
      }

      return true;
    });
  }, [expenses, filterType, selectedCategory, searchTerm]);

  // Agrupamiento ordenado cronológicamente
  const groupedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    if (groupBy === 'none') return sorted;

    if (groupBy === 'date') {
      const groups = {};
      sorted.forEach((exp) => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        if (!groups[d]) groups[d] = { myTotal: 0, items: [] };
        groups[d].items.push(exp);
        groups[d].myTotal += getMyShareForExpense(exp);
      });
      return groups;
    }

    if (groupBy === 'category') {
      const groups = {};
      sorted.forEach((exp) => {
        const cat = exp.category || 'Otros';
        if (!groups[cat]) groups[cat] = { myTotal: 0, items: [] };
        groups[cat].items.push(exp);
        groups[cat].myTotal += getMyShareForExpense(exp);
      });
      return groups;
    }

    if (groupBy === 'both') {
      const groups = {};
      sorted.forEach((exp) => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        const cat = exp.category || 'Otros';
        const share = getMyShareForExpense(exp);

        if (!groups[d]) groups[d] = { myTotal: 0, categories: {} };
        if (!groups[d].categories[cat]) groups[d].categories[cat] = { myTotal: 0, items: [] };

        groups[d].categories[cat].items.push(exp);
        groups[d].categories[cat].myTotal += share;
        groups[d].myTotal += share;
      });
      return groups;
    }

    return null;
  }, [filteredExpenses, groupBy, getMyShareForExpense]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-400" />
          <span>Historial de Gastos ({filteredExpenses.length})</span>
        </h2>
      </div>

      <ExpenseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        categories={availableCategories}
      />

      {filteredExpenses.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">
          No hay gastos que coincidan con los filtros seleccionados.
        </p>
      ) : groupBy === 'none' ? (
        <div className="divide-y divide-slate-800">
          {groupedExpenses.map((exp) => (
            <ExpenseItem
              key={exp._id}
              expense={exp}
              project={project}
              currentUser={currentUser}
              isMe={isMe}
              getMyShareForExpense={getMyShareForExpense}
              onUpdate={onUpdateExpense}
              onDelete={onDeleteExpense}
              groupBy={groupBy}
            />
          ))}
        </div>
      ) : groupBy === 'date' || groupBy === 'category' ? (
        <div className="space-y-3">
          {Object.entries(groupedExpenses || {}).map(([key, groupData]) => {
            const isToday = key === todayStr;
            const isOpen = openAccordions[key] ?? (groupBy === 'date' ? isToday : true);

            return (
              <div
                key={key}
                className={`border rounded-xl transition-colors overflow-hidden ${
                  isToday
                    ? 'border-indigo-500/40 bg-slate-950/70 shadow-sm'
                    : 'border-slate-800/80 bg-slate-950/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/30 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <span className="font-semibold text-white text-sm">{key}</span>
                      {isToday && (
                        <span className="ml-2 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                          Hoy
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-2">
                        ({groupData.items.length} {groupData.items.length === 1 ? 'gasto' : 'gastos'})
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-emerald-400">
                    {groupData.myTotal.toFixed(2)} {project?.currency || '€'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 divide-y divide-slate-800/40">
                    {groupData.items.map((exp) => (
                      <ExpenseItem
                        key={exp._id}
                        expense={exp}
                        project={project}
                        currentUser={currentUser}
                        isMe={isMe}
                        getMyShareForExpense={getMyShareForExpense}
                        onUpdate={onUpdateExpense}
                        onDelete={onDeleteExpense}
                        groupBy={groupBy}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista doble: Día y Categoría */
        <div className="space-y-4">
          {Object.entries(groupedExpenses || {}).map(([d, dayData]) => {
            const isToday = d === todayStr;
            const isOpen = openAccordions[d] ?? isToday;

            return (
              <div key={d} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => toggleAccordion(d)}
                  className="w-full flex justify-between items-center pb-2 border-b border-slate-800/80 mb-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-semibold text-indigo-400 text-sm">{d}</span>
                    {isToday && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                        Hoy
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5">
                    {dayData.myTotal.toFixed(2)} {project?.currency || '€'}
                  </span>
                </button>

                {isOpen && (
                  <div className="space-y-4 pl-2 pt-2">
                    {Object.entries(dayData.categories || {}).map(([catName, catData]) => (
                      <div key={catName}>
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-medium bg-slate-900/50 px-2 py-1 rounded">
                          <span>{catName} ({catData.items.length})</span>
                          <span className="text-emerald-400 font-semibold mr-1.5">
                            Subtotal: {catData.myTotal.toFixed(2)} {project?.currency || '€'}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-800/40">
                          {catData.items.map((exp) => (
                            <ExpenseItem
                              key={exp._id}
                              expense={exp}
                              project={project}
                              currentUser={currentUser}
                              isMe={isMe}
                              getMyShareForExpense={getMyShareForExpense}
                              onUpdate={onUpdateExpense}
                              onDelete={onDeleteExpense}
                              groupBy={groupBy}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}