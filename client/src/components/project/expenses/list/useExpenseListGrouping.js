import { useState, useMemo } from 'react';

export function useExpenseListGrouping({ expenses = [], getMyShareForExpense }) {
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

  return {
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
  };
}