import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  Receipt, 
  Plus, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  Users,
  Layers,
  Filter
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formulario de gasto
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida / Restaurante');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPersonal, setIsPersonal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Controles de visualización
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'date' | 'category' | 'both'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'shared' | 'personal'

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, balancesRes, expensesRes] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/expenses/balances`),
        api.get(`/projects/${id}/expenses`)
      ]);

      if (projectRes.status === 'fulfilled') {
        const pData = projectRes.value.data;
        setProject(pData?.data?.project || pData?.project || pData?.data || pData);
      }

      if (balancesRes.status === 'fulfilled') {
        setBalances(balancesRes.value.data?.data || balancesRes.value.data);
      }

      if (expensesRes.status === 'fulfilled') {
        const eData = expensesRes.value.data;
        const list = eData?.data?.expenses || eData?.expenses || eData?.data || (Array.isArray(eData) ? eData : []);
        setExpenses(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Error cargando el proyecto:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Introduce un importe válido mayor que 0.');
      return;
    }

    const payload = {
      title: title.trim(),
      amount: numericAmount,
      category,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      isPersonal: Boolean(isPersonal),
    };

    console.log('📤 Enviando nuevo gasto a la API:', payload);

    setIsSubmitting(true);
    try {
      await api.post(`/projects/${id}/expenses`, payload);

      // Limpiar formulario y resetear a valores por defecto
      setTitle('');
      setAmount('');
      setCategory('Comida / Restaurante');
      setDate(new Date().toISOString().split('T')[0]);
      setIsPersonal(false);

      // Recargar lista de gastos y balances recalculados
      await loadProjectData();
    } catch (err) {
      console.error('Error al registrar el gasto:', err);
      setError(err.response?.data?.message || 'Error al registrar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filterType === 'shared') return !exp.isPersonal;
      if (filterType === 'personal') return exp.isPersonal;
      return true;
    });
  }, [expenses, filterType]);

  // Agrupación flexible
  const groupedExpenses = useMemo(() => {
    if (groupBy === 'none') return null;

    if (groupBy === 'date') {
      const groups = {};
      filteredExpenses.forEach(exp => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        if (!groups[d]) groups[d] = { total: 0, items: [] };
        groups[d].items.push(exp);
        groups[d].total += Number(exp.amount);
      });
      return groups;
    }

    if (groupBy === 'category') {
      const groups = {};
      filteredExpenses.forEach(exp => {
        const cat = exp.category || 'Sin categoría';
        if (!groups[cat]) groups[cat] = { total: 0, items: [] };
        groups[cat].items.push(exp);
        groups[cat].total += Number(exp.amount);
      });
      return groups;
    }

    if (groupBy === 'both') {
      const groups = {};
      filteredExpenses.forEach(exp => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        const cat = exp.category || 'Sin categoría';
        if (!groups[d]) groups[d] = { total: 0, categories: {} };
        if (!groups[d].categories[cat]) groups[d].categories[cat] = { total: 0, items: [] };
        
        groups[d].categories[cat].items.push(exp);
        groups[d].categories[cat].total += Number(exp.amount);
        groups[d].total += Number(exp.amount);
      });
      return groups;
    }

    return null;
  }, [filteredExpenses, groupBy]);

  const renderExpenseItem = (exp, idx) => (
    <div key={exp._id || idx} className="py-3 px-3 hover:bg-slate-800/40 rounded-lg flex items-center justify-between transition-colors">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{exp.title}</p>
          {exp.isPersonal ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/40">
              <UserCheck className="w-3 h-3" /> Personal
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/40">
              <Users className="w-3 h-3" /> Compartido
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {exp.category || 'General'} • Pagado por <span className="text-slate-300 font-medium">{exp.paidBy?.name || 'Tú'}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-emerald-400">
          {Number(exp.amount).toFixed(2)} {project.currency || '€'}
        </p>
        <p className="text-[11px] text-slate-500">
          {new Date(exp.date || exp.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">
        <p>No se encontró el proyecto o no tienes acceso.</p>
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">Volver al Dashboard</Link>
      </div>
    );
  }

  const settlements = balances?.settlements || balances?.transactions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Proyectos
      </Link>

      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-900/50">
                {project.type}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{project.description || 'Sin descripción'}</p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 self-start sm:self-auto">
            <div>
              <p className="text-xs text-slate-500">Total Gastado</p>
              <p className="text-base font-bold text-emerald-400">
                {expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toFixed(2)} {project.currency || '€'}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <p className="text-xs text-slate-500">Presupuesto</p>
              <p className="text-base font-bold text-indigo-400">
                {project.budget ? `${project.budget} ${project.currency || '€'}` : 'Sin límite'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario + Historial con Agrupaciones */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Formulario Añadir Gasto */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Añadir Nuevo Gasto</span>
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Café, Souvenir, Gasolina..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Importe ({project.currency || '€'})</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Comida / Restaurante">Restaurante</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Alojamiento">Alojamiento</option>
                  <option value="Ocio">Ocio</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Compras personales">Compras personales</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span>Gasto personal (no dividir)</span>
                </label>
              </div>

              <div className="sm:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Registrar Gasto'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historial con Filtros y Agrupación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <span>Historial de Gastos ({filteredExpenses.length})</span>
              </h2>

              {/* Controles de Filtro y Agrupación */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">Todos</option>
                    <option value="shared" className="bg-slate-900">Compartidos</option>
                    <option value="personal" className="bg-slate-900">Solo Personales</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
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

            {filteredExpenses.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                No hay gastos que coincidan con los filtros seleccionados.
              </p>
            ) : groupBy === 'none' ? (
              <div className="divide-y divide-slate-800">
                {filteredExpenses.map((exp, idx) => renderExpenseItem(exp, idx))}
              </div>
            ) : groupBy === 'both' ? (
              <div className="space-y-6">
                {Object.entries(groupedExpenses).map(([d, dayData]) => (
                  <div key={d} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-3">
                      <span className="font-semibold text-indigo-400 text-sm">{d}</span>
                      <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        Subtotal día: {dayData.total.toFixed(2)} {project.currency || '€'}
                      </span>
                    </div>
                    <div className="space-y-4 pl-2">
                      {Object.entries(dayData.categories).map(([catName, catData]) => (
                        <div key={catName}>
                          <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-medium">
                            <span>{catName}</span>
                            <span>{catData.total.toFixed(2)} {project.currency || '€'}</span>
                          </div>
                          <div className="divide-y divide-slate-800/40">
                            {catData.items.map((exp, idx) => renderExpenseItem(exp, idx))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedExpenses).map(([groupKey, groupData]) => (
                  <div key={groupKey} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 mb-2">
                      <span className="font-semibold text-indigo-400 text-sm">{groupKey}</span>
                      <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        Subtotal: {groupData.total.toFixed(2)} {project.currency || '€'}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {groupData.items.map((exp, idx) => renderExpenseItem(exp, idx))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Liquidaciones */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Liquidación Óptima</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Transacciones calculadas para deudas compartidas (los gastos personales se excluyen automáticamente).
            </p>

            {settlements.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-slate-400 text-sm">
                No hay deudas pendientes entre los participantes.
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((tx, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-red-400">{tx.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-emerald-400">{tx.to}</span>
                    </div>
                    <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-md text-xs">
                      {Number(tx.amount).toFixed(2)} {project.currency || '€'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}