import { Receipt } from 'lucide-react';
import { ExpenseItem } from '../item';
import ExpenseFilters from './ExpenseFilters';
import ExpenseGroupAccordion from './ExpenseGroupAccordion';
import ExpenseNestedGroupAccordion from './ExpenseNestedGroupAccordion';
import { useExpenseListGrouping } from './useExpenseListGrouping';

export default function ExpenseList({
  expenses = [],
  project,
  currentUser,
  isMe,
  getMyShareForExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    selectedCategory,
    setSelectedCategory,
    groupBy,
    setGroupBy,
    todayStr,
    openAccordions,
    toggleAccordion,
    availableCategories,
    filteredExpenses,
    groupedExpenses,
  } = useExpenseListGrouping({ expenses, getMyShareForExpense });

  const currency = project?.currency || '€';

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