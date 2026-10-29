import { useState, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { ExpenseItem } from '../item';
import ExpenseFilters from './ExpenseFilters';
import ExpenseGroupAccordion from './ExpenseGroupAccordion';
import ExpenseNestedGroupAccordion from './ExpenseNestedGroupAccordion';

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

  // 1. Filtrar solo compras ordinarias
  const regularExpenses = useMemo(() => {
    return expenses.filter((e) => !e.isSettlement);
  }, [expenses]);

  // 2. Obtener categorías únicas
  const availableCategories = useMemo(() => {
    const set = new Set();
    regularExpenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [regularExpenses]);

  // 3. Filtrado compuesto
  const filteredExpenses = useMemo(() => {
    return regularExpenses.filter((exp) => {
      if (filterType === 'shared' && exp.isPersonal) return false;
      if (filterType === 'personal' && !exp.isPersonal) return false;
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(term);
        const matchesPayer = exp.paidBy?.name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesPayer) return false;
      }

      return true;
    });
  }, [regularExpenses, filterType, selectedCategory, searchTerm]);

  // 4. Agrupamiento cronológico
  const groupedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    if (groupBy === 'none') return sorted;

    if (groupBy === 'date' || groupBy === 'category') {
      const groups = {};
      sorted.forEach((exp) => {
        const key = groupBy === 'date'
          ? new Date(exp.date || exp.createdAt).toLocaleDateString()
          : (exp.category || 'Otros');

        if (!groups[key]) groups[key] = { myTotal: 0, items: [] };
        groups[key].items.push(exp);
        groups[key].myTotal += getMyShareForExpense(exp);
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

  const currency = project?.currency || '€';

  // Helper para renderizar items sin duplicar props
  const renderItem = (exp) => (
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
  );

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
          {groupedExpenses.map(renderItem)}
        </div>
      ) : groupBy === 'date' || groupBy === 'category' ? (
        <div className="space-y-3">
          {Object.entries(groupedExpenses || {}).map(([key, groupData]) => (
            <ExpenseGroupAccordion
              key={key}
              groupKey={key}
              groupData={groupData}
              isToday={key === todayStr}
              isOpen={openAccordions[key] ?? (groupBy === 'date' ? key === todayStr : true)}
              onToggle={() => toggleAccordion(key)}
              currency={currency}
              project={project}
              currentUser={currentUser}
              isMe={isMe}
              getMyShareForExpense={getMyShareForExpense}
              onUpdateExpense={onUpdateExpense}
              onDeleteExpense={onDeleteExpense}
              groupBy={groupBy}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedExpenses || {}).map(([d, dayData]) => (
            <ExpenseNestedGroupAccordion
              key={d}
              dateKey={d}
              dayData={dayData}
              isToday={d === todayStr}
              isOpen={openAccordions[d] ?? (d === todayStr)}
              onToggle={() => toggleAccordion(d)}
              currency={currency}
              renderItem={renderItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}