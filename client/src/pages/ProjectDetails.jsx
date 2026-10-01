import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Receipt, Plus, Calendar, CreditCard, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, balancesRes, expensesRes] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/expenses/balances`),
        api.get(`/projects/${id}/expenses`)
      ]);

      // 1. Cargar datos del proyecto
      if (projectRes.status === 'fulfilled') {
        const pData = projectRes.value.data;
        const extractedProject = 
          pData?.data?.project || 
          pData?.project || 
          pData?.data || 
          pData;
        setProject(extractedProject);
      }

      // 2. Cargar balances y liquidaciones
      if (balancesRes.status === 'fulfilled') {
        const bData = balancesRes.value.data;
        setBalances(bData?.data || bData);
      }

      // 3. Cargar lista de gastos desde su endpoint dedicado
      if (expensesRes.status === 'fulfilled') {
        const eData = expensesRes.value.data;
        const expenseList = 
          eData?.data?.expenses || 
          eData?.expenses || 
          eData?.data || 
          (Array.isArray(eData) ? eData : []);
        setExpenses(Array.isArray(expenseList) ? expenseList : []);
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

    if (!amount || Number(amount) <= 0) {
      setError('Introduce un importe válido mayor que 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/projects/${id}/expenses`, {
        title,
        amount: Number(amount),
        category,
      });

      setTitle('');
      setAmount('');
      setCategory('Comida / Restaurante');
      await loadProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const settlements = balances?.settlements || balances?.transactions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Mis Proyectos
      </Link>

      {/* Encabezado del Proyecto */}
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
              <p className="text-xs text-slate-500">Moneda</p>
              <p className="text-base font-bold text-white">{project.currency || 'EUR'}</p>
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
        
        {/* Columna Izquierda: Formulario y Registro de Gastos */}
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
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cena, Peajes..."
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
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Registrar Gasto'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historial de Gastos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <span>Historial de Gastos ({expenses.length})</span>
            </h2>

            {expenses.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                No hay gastos registrados todavía en este proyecto.
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {expenses.map((exp, idx) => (
                  <div key={exp._id || idx} className="py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{exp.title}</p>
                      <p className="text-xs text-slate-400">
                        {exp.category || 'General'} • Pagado por <span className="text-indigo-400">{exp.paidBy?.name || 'Usuario'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        {Number(exp.amount).toFixed(2)} {project.currency || '€'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(exp.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Liquidaciones y Balances Óptimos */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Liquidación Óptima</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Transacciones mínimas calculadas por el algoritmo para saldar todas las deudas.
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