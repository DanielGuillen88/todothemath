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
  Filter,
  Trash2,
  X,
  Check,
  Pencil,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Crown
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const currentUserId = String(user?._id || user?.id || user?.user?._id || user?.user?.id || '');
  const currentUserEmail = (user?.email || user?.user?.email || '').toLowerCase().trim();

  const isMe = useCallback((target) => {
    if (!target) return false;
    if (typeof target === 'string') {
      return target === currentUserId || (currentUserEmail && target.toLowerCase() === currentUserEmail);
    }
    const targetId = String(target._id || target.id || '');
    const targetEmail = (target.email || '').toLowerCase().trim();
    return (currentUserId && targetId === currentUserId) || (currentUserEmail && targetEmail === currentUserEmail);
  }, [currentUserId, currentUserEmail]);

  const [project, setProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de control para eliminación inline
  const [deletingId, setDeletingId] = useState(null);
  const [deletedId, setDeletedId] = useState(null);

  // Formulario de gasto (Gasto personal por defecto)
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida / Restaurante');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPersonal, setIsPersonal] = useState(true);
  const [paidBy, setPaidBy] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Formulario de invitar participante
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });

  // Controles de visualización
  const [groupBy, setGroupBy] = useState('date'); // 'none' | 'date' | 'category' | 'both'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'shared' | 'personal'

  // Control de edición inline
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: '',
    isPersonal: false,
    paidBy: '',
  });

  const [confirmSaveId, setConfirmSaveId] = useState(null);
  const [updatedId, setUpdatedId] = useState(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString(), []);
  const [openAccordions, setOpenAccordions] = useState({ [todayStr]: true });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const loadProjectData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [projectRes, balancesRes, expensesRes] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/expenses/balances`),
        api.get(`/projects/${id}/expenses`)
      ]);

      if (projectRes.status === 'fulfilled') {
        const pData = projectRes.value.data;
        const extracted = 
          pData?.data?.project || 
          pData?.project || 
          pData?.data || 
          pData;

        if (extracted && (extracted._id || extracted.title)) {
          setProject(extracted);
          if (!paidBy) {
            const defaultPayer = currentUserId || extracted.members?.[0]?._id;
            setPaidBy(defaultPayer);
            setSelectedMembers(extracted.members.map(m => m._id || m));
          }
        }
      }

      if (balancesRes.status === 'fulfilled') {
        const bData = balancesRes.value.data;
        setBalances(bData?.data || bData);
      }

      if (expensesRes.status === 'fulfilled') {
        const eData = expensesRes.value.data;
        const list = 
          eData?.data?.expenses || 
          eData?.expenses || 
          eData?.data || 
          (Array.isArray(eData) ? eData : []);
        setExpenses(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Error cargando el proyecto:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, paidBy, currentUserId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Cuota calculada para un gasto individual
  const getMyShareForExpense = useCallback((exp) => {
    const rawAmount = Number(exp?.amount || 0);
    if (!rawAmount || rawAmount <= 0) return 0;

    if (exp.isPersonal) {
      return isMe(exp.paidBy) ? rawAmount : 0;
    }

    if (Array.isArray(exp.splitBetween) && exp.splitBetween.length > 0) {
      const mySplitItem = exp.splitBetween.find(item => isMe(item.user) || isMe(item));
      if (mySplitItem) {
        return Number(mySplitItem.share ?? (rawAmount / exp.splitBetween.length));
      }
      return 0;
    }

    const totalMembers = project?.members?.length || 1;
    return Number((rawAmount / totalMembers).toFixed(2));
  }, [isMe, project?.members]);

  // Métricas desglosadas
  const metrics = useMemo(() => {
    let myRealShareTotal = 0;
    let totalProjectShared = 0;
    let myPersonalOnlyTotal = 0;

    expenses.forEach((exp) => {
      const rawAmount = Number(exp.amount || 0);
      const isPaidByMe = isMe(exp.paidBy);

      if (exp.isPersonal) {
        if (isPaidByMe) {
          myRealShareTotal += rawAmount;
          myPersonalOnlyTotal += rawAmount;
        }
      } else {
        totalProjectShared += rawAmount;
        myRealShareTotal += getMyShareForExpense(exp);
      }
    });

    return {
      myRealTotal: myRealShareTotal,
      totalShared: totalProjectShared,
      myPersonal: myPersonalOnlyTotal,
    };
  }, [expenses, isMe, getMyShareForExpense]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteMsg({ text: '', type: '' });

    try {
      const res = await api.post(`/projects/${id}/members`, {
        email: inviteEmail.trim().toLowerCase(),
      });

      setInviteMsg({
        text: res.data?.message || 'Participante añadido con éxito.',
        type: 'success',
      });
      setInviteEmail('');
      await loadProjectData(true);
    } catch (err) {
      console.error('Error al invitar participante:', err);
      setInviteMsg({
        text: err.response?.data?.message || 'Error al añadir el participante.',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
      setTimeout(() => setInviteMsg({ text: '', type: '' }), 4000);
    }
  };

  const toggleMemberSplit = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('Introduce un importe válido mayor que 0.');
      return;
    }

    let splitPayload = [];
    if (!isPersonal && selectedMembers.length > 0) {
      const sharePerPerson = Number((numericAmount / selectedMembers.length).toFixed(2));
      splitPayload = selectedMembers.map(mId => ({
        user: mId,
        share: sharePerPerson
      }));
    }

    const payload = {
      title: title.trim(),
      amount: numericAmount,
      category,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      isPersonal: Boolean(isPersonal),
      paidBy: isPersonal ? currentUserId : (paidBy || currentUserId || project?.members?.[0]?._id),
      splitBetween: isPersonal ? undefined : splitPayload,
    };

    setIsSubmitting(true);
    try {
      await api.post(`/projects/${id}/expenses`, payload);

      setTitle('');
      setAmount('');
      setCategory('Comida / Restaurante');
      setDate(new Date().toISOString().split('T')[0]);
      setIsPersonal(true);
      setPaidBy(currentUserId || project?.members?.[0]?._id);
      if (project?.members) {
        setSelectedMembers(project.members.map(m => m._id || m));
      }

      await loadProjectData(true);
    } catch (err) {
      console.error('Error al registrar el gasto:', err);
      setError(err.response?.data?.message || 'Error al registrar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!expenseId) return;

    try {
      await api.delete(`/projects/${id}/expenses/${expenseId}`);

      setDeletingId(null);
      setDeletedId(expenseId);

      setTimeout(async () => {
        await loadProjectData(true);
        setDeletedId(null);
      }, 700);
    } catch (err) {
      console.error('Error al eliminar el gasto:', err);
      setDeletingId(null);
      alert(err.response?.data?.message || 'Error al eliminar el gasto');
    }
  };

  const startEditing = (exp) => {
    setDeletingId(null);
    setConfirmSaveId(null);
    setEditingId(exp._id);
    setEditForm({
      title: exp.title,
      amount: exp.amount,
      category: exp.category || 'General',
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isPersonal: Boolean(exp.isPersonal),
      paidBy: exp.paidBy?._id || exp.paidBy || project?.members?.[0]?._id,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setConfirmSaveId(null);
  };

  const handleUpdateExpense = async (expenseId) => {
    if (!editForm.title.trim() || Number(editForm.amount) <= 0) {
      alert('Introduce un concepto y un importe válido mayor que 0.');
      return;
    }

    try {
      await api.put(`/projects/${id}/expenses/${expenseId}`, {
        title: editForm.title.trim(),
        amount: Number(editForm.amount),
        category: editForm.category,
        date: new Date(editForm.date).toISOString(),
        isPersonal: editForm.isPersonal,
        paidBy: editForm.paidBy,
      });

      setEditingId(null);
      setConfirmSaveId(null);
      setUpdatedId(expenseId);

      setTimeout(async () => {
        await loadProjectData(true);
        setUpdatedId(null);
      }, 800);
    } catch (err) {
      console.error('Error actualizando el gasto:', err);
      setConfirmSaveId(null);
      alert(err.response?.data?.message || 'Error al actualizar el gasto');
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filterType === 'shared') return !exp.isPersonal;
      if (filterType === 'personal') return exp.isPersonal;
      return true;
    });
  }, [expenses, filterType]);

  // Agrupación de gastos con cálculo exacto de cuotas
  const groupedExpenses = useMemo(() => {
    if (groupBy === 'none') {
      return [...filteredExpenses].sort((a, b) => 
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );
    }

    if (groupBy === 'date') {
      const sorted = [...filteredExpenses].sort((a, b) => 
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );

      const groups = {};
      sorted.forEach(exp => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        if (!groups[d]) groups[d] = { myTotal: 0, groupTotal: 0, items: [] };
        groups[d].items.push(exp);
        groups[d].myTotal += getMyShareForExpense(exp);
        groups[d].groupTotal += Number(exp.amount || 0);
      });
      return groups;
    }

    if (groupBy === 'category') {
      const groups = {};
      filteredExpenses.forEach(exp => {
        const cat = exp.category || 'Sin categoría';
        if (!groups[cat]) groups[cat] = { myTotal: 0, groupTotal: 0, items: [] };
        groups[cat].items.push(exp);
        groups[cat].myTotal += getMyShareForExpense(exp);
        groups[cat].groupTotal += Number(exp.amount || 0);
      });

      Object.keys(groups).forEach(cat => {
        groups[cat].items.sort((a, b) => 
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
      });

      return groups;
    }

    if (groupBy === 'both') {
      const sorted = [...filteredExpenses].sort((a, b) => 
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );

      const groups = {};
      sorted.forEach(exp => {
        const d = new Date(exp.date || exp.createdAt).toLocaleDateString();
        const cat = exp.category || 'Sin categoría';
        const share = getMyShareForExpense(exp);
        const raw = Number(exp.amount || 0);

        if (!groups[d]) {
          groups[d] = { myTotal: 0, groupTotal: 0, categories: {} };
        }
        if (!groups[d].categories[cat]) {
          groups[d].categories[cat] = { myTotal: 0, groupTotal: 0, items: [] };
        }

        groups[d].categories[cat].items.push(exp);
        groups[d].categories[cat].myTotal += share;
        groups[d].categories[cat].groupTotal += raw;

        groups[d].myTotal += share;
        groups[d].groupTotal += raw;
      });

      Object.values(groups).forEach(day => {
        Object.values(day.categories).forEach(catObj => {
          catObj.items.sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          );
        });
      });

      return groups;
    }

    return null;
  }, [filteredExpenses, groupBy, getMyShareForExpense]);

  const renderExpenseItem = (exp, idx) => {
    const isConfirmingDelete = deletingId === exp._id;
    const isDeleted = deletedId === exp._id;
    const isEditing = editingId === exp._id;
    const isConfirmingSave = confirmSaveId === exp._id;
    const isUpdated = updatedId === exp._id;

    const myShare = getMyShareForExpense(exp);
    const paidByMe = isMe(exp.paidBy);
    const payerName = paidByMe ? 'Tú' : (exp.paidBy?.name || 'Otro miembro');

    if (isDeleted) {
      return (
        <div
          key={exp._id || idx}
          className="py-3 px-3 my-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-pulse"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Gasto eliminado correctamente</span>
        </div>
      );
    }

    if (isUpdated) {
      return (
        <div
          key={exp._id || idx}
          className="py-3 px-3 my-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium animate-pulse"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Gasto actualizado correctamente</span>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div key={exp._id || idx} className="p-3.5 my-1 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Concepto"
              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              step="any"
              min="0.01"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              placeholder="Importe"
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Comida / Restaurante">Restaurante</option>
              <option value="Transporte">Transporte</option>
              <option value="Alojamiento">Alojamiento</option>
              <option value="Ocio">Ocio</option>
              <option value="Supermercado">Supermercado</option>
              <option value="Compras personales">Compras personales</option>
              <option value="Otros">Otros</option>
            </select>

            <select
              value={editForm.paidBy}
              onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {project?.members?.map((m, mIdx) => {
                const memberId = m?._id || m;
                const memberName = m?.name || `Usuario (${String(memberId).slice(-4)})`;
                return (
                  <option key={memberId || mIdx} value={memberId}>
                    Pagado por: {memberName}
                  </option>
                );
              })}
            </select>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={editForm.isPersonal}
                onChange={(e) => setEditForm({ ...editForm, isPersonal: e.target.checked })}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Gasto Personal</span>
            </label>
          </div>

          <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-800">
            {isConfirmingSave ? (
              <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/60 px-2.5 py-1 rounded-lg">
                <span className="text-xs text-indigo-200 font-medium mr-1">¿Guardar cambios?</span>
                <button
                  type="button"
                  onClick={() => handleUpdateExpense(exp._id)}
                  title="Confirmar guardado"
                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSaveId(null)}
                  title="Volver a la edición"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSaveId(exp._id)}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Guardar
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div 
        key={exp._id || idx} 
        className={`py-3.5 px-3 hover:bg-slate-800/40 rounded-xl flex items-center justify-between transition-colors group ${
          isConfirmingDelete ? 'bg-red-950/20 border border-red-900/50' : ''
        }`}
      >
        {/* Información izquierda: Concepto, badge y detalles */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{exp.title}</p>
            {exp.isPersonal ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/40 shrink-0">
                <UserCheck className="w-3 h-3" /> Personal
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/40 shrink-0">
                <Users className="w-3 h-3" /> Compartido
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1">
            {groupBy !== 'category' && groupBy !== 'both' && (
              <>
                <span className="text-slate-300 font-medium">{exp.category || 'General'}</span>
                <span>•</span>
              </>
            )}
            <span>
              Pagado por <span className="text-slate-200 font-medium">{payerName}</span>
            </span>
            {!exp.isPersonal && exp.splitBetween?.length > 0 && (
              <span className="text-slate-500">
                (dividido entre {exp.splitBetween.length})
              </span>
            )}
          </div>
        </div>

        {/* Zona derecha: Acciones primero, luego importes en el extremo alineados con el total del día */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Botones de Acción (Editar / Eliminar) */}
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-slate-950/90 border border-red-900/60 px-2.5 py-1.5 rounded-lg shadow-inner">
              <span className="text-xs text-red-300 font-medium mr-1">¿Eliminar?</span>
              <button
                onClick={() => handleDeleteExpense(exp._id)}
                title="Confirmar eliminación"
                className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeletingId(null)}
                title="Cancelar"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEditing(exp)}
                title="Editar gasto"
                className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-950/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingId(exp._id)}
                title="Eliminar gasto"
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bloque numérico en el extremo derecho */}
          <div className="text-right flex flex-col items-end min-w-[85px]">
            <div className="flex items-center gap-1.5">
              {!exp.isPersonal && <span className="text-[11px] text-slate-500">Total:</span>}
              <span className={`text-sm font-bold ${exp.isPersonal ? 'text-emerald-400' : 'text-white'}`}>
                {Number(exp.amount || 0).toFixed(2)} {project?.currency || '€'}
              </span>
            </div>
            
            {!exp.isPersonal && (
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <span className="text-slate-400">Tu parte:</span>
                <span className="font-semibold text-emerald-400">
                  {myShare.toFixed(2)} {project?.currency || '€'}
                </span>
              </div>
            )}

            <p className="text-[10px] text-slate-500 mt-0.5">
              {groupBy === 'date' || groupBy === 'both'
                ? new Date(exp.createdAt || exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : `${new Date(exp.date || exp.createdAt).toLocaleDateString()} • ${new Date(exp.createdAt || exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !project) {
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
                {project?.type || 'General'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project?.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{project?.description || 'Sin descripción'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 self-start sm:self-auto">
            {/* Total Personales */}
            <div>
              <p className="text-xs text-slate-400 font-medium">Personales</p>
              <p className="text-base sm:text-lg font-bold text-slate-200">
                {metrics.myPersonal.toFixed(2)} {project?.currency || '€'}
              </p>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

            {/* Total junto a gastos compartidos */}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-400 font-medium">Total</p>
              </div>
              <p className="text-base sm:text-lg font-bold text-emerald-400">
                {metrics.myRealTotal.toFixed(2)} {project?.currency || '€'}
              </p>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

            {/* Presupuesto */}
            <div>
              <p className="text-xs text-slate-400 font-medium">Presupuesto</p>
              <p className="text-base sm:text-lg font-bold text-indigo-400">
                {project?.budget ? `${project.budget} ${project?.currency || '€'}` : 'Sin límite'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidación Óptima */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
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
            {settlements.map((tx, idx) => {
              const fromName = typeof tx.from === 'object' ? (tx.from?.name || tx.from?.email || 'Participante') : tx.from;
              const toName = typeof tx.to === 'object' ? (tx.to?.name || tx.to?.email || 'Participante') : tx.to;

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-red-400">{fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-emerald-400">{toName}</span>
                  </div>
                  <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-md text-xs">
                    {Number(tx.amount || 0).toFixed(2)} {project?.currency || '€'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario + Historial */}
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
                  placeholder="Cena, Peajes, Entradas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Importe ({project?.currency || '€'})</label>
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

              {/* Selector de Quién Pagó (Solo visible si es compartido) */}
              {!isPersonal && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Pagado por</label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {project?.members?.map((m, idx) => {
                      const memberId = String(m?._id || m?.id || m);
                      const ownerId = String(project?.owner?._id || project?.owner?.id || project?.owner);
                      const isOwner = memberId === ownerId;
                      const isCurrent = memberId === currentUserId;
                      const memberName = m?.name || `Usuario (${memberId.slice(-4)})`;

                      return (
                        <option key={`paidby-${memberId}-${idx}`} value={memberId}>
                          {memberName} {isCurrent ? '(Tú)' : ''} {isOwner ? '👑' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Toggle Personal vs Compartido */}
              <div className="sm:col-span-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span>Gasto personal (solo lo asume quien pagó, no entra en el reparto)</span>
                </label>
              </div>

              {/* Selector de reparto si es compartido */}
              {!isPersonal && project?.members && project.members.length > 1 && (
                <div className="sm:col-span-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Dividir gasto entre:</span>
                    <span className="text-[11px] text-indigo-400">
                      {selectedMembers.length} seleccionados ({Number(amount ? (Number(amount) / selectedMembers.length).toFixed(2) : 0)} {project.currency}/persona)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.members.map((m, idx) => {
                      const memberId = String(m?._id || m?.id || m);
                      const isIncluded = selectedMembers.some(mid => String(mid) === memberId);
                      const memberName = m?.name || `Usuario (${memberId.slice(-4)})`;

                      return (
                        <button
                          key={`split-${memberId}-${idx}`}
                          type="button"
                          onClick={() => toggleMemberSplit(memberId)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                            isIncluded
                              ? 'bg-indigo-950/80 border-indigo-600/70 text-indigo-200'
                              : 'bg-slate-900 border-slate-800 text-slate-500 line-through'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isIncluded ? 'bg-indigo-400' : 'bg-slate-600'}`}></span>
                          {memberName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="sm:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
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
                {groupedExpenses.map((exp, idx) => renderExpenseItem(exp, idx))}
              </div>
            ) : groupBy === 'date' ? (
              <div className="space-y-3">
                {Object.entries(groupedExpenses || {}).map(([d, dayData]) => {
                  const isToday = d === todayStr;
                  const isOpen = openAccordions[d] ?? isToday;

                  return (
                    <div 
                      key={d} 
                      className={`border rounded-xl transition-colors overflow-hidden ${
                        isToday 
                          ? 'border-indigo-500/40 bg-slate-950/70 shadow-sm' 
                          : 'border-slate-800/80 bg-slate-950/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(d)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/30 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                          <div>
                            <span className="font-semibold text-white text-sm">
                              {d}
                            </span>
                            {isToday && (
                              <span className="ml-2 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                                Hoy
                              </span>
                            )}
                            <span className="text-xs text-slate-500 ml-2">
                              ({dayData.items.length} {dayData.items.length === 1 ? 'gasto' : 'gastos'})
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium mr-1.5">Tu total día:</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {dayData.myTotal.toFixed(2)} {project?.currency || '€'}
                          </span>
                          {dayData.groupTotal !== dayData.myTotal && (
                            <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                              (Grupo: {dayData.groupTotal.toFixed(2)} {project?.currency || '€'})
                            </span>
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 divide-y divide-slate-800/40">
                          {dayData.items.map((exp, idx) => renderExpenseItem(exp, idx))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : groupBy === 'category' ? (
              <div className="space-y-3">
                {Object.entries(groupedExpenses || {}).map(([catName, catData]) => {
                  const isOpen = openAccordions[catName] ?? true;

                  return (
                    <div 
                      key={catName} 
                      className="border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(catName)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/30 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="font-semibold text-white text-sm">
                            {catName}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({catData.items.length} {catData.items.length === 1 ? 'gasto' : 'gastos'})
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-medium mr-1.5">Tu total:</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {catData.myTotal.toFixed(2)} {project?.currency || '€'}
                          </span>
                          {catData.groupTotal !== catData.myTotal && (
                            <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                              (Grupo: {catData.groupTotal.toFixed(2)} {project?.currency || '€'})
                            </span>
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 divide-y divide-slate-800/40">
                          {catData.items.map((exp, idx) => renderExpenseItem(exp, idx))}
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
                          {isOpen ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          <span className="font-semibold text-indigo-400 text-sm">{d}</span>
                          {isToday && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                              Hoy
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                            Tu total día: {dayData.myTotal.toFixed(2)} {project?.currency || '€'}
                          </span>
                          {dayData.groupTotal !== dayData.myTotal && (
                            <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                              (Grupo: {dayData.groupTotal.toFixed(2)} {project?.currency || '€'})
                            </span>
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="space-y-4 pl-2 pt-2">
                          {Object.entries(dayData.categories || {}).map(([catName, catData]) => (
                            <div key={catName}>
                              <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-medium bg-slate-900/50 px-2 py-1 rounded">
                                <span>{catName} ({catData.items.length})</span>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-semibold mr-1.5">
                                    Tu parte: {catData.myTotal.toFixed(2)} {project?.currency || '€'}
                                  </span>
                                  {catData.groupTotal !== catData.myTotal && (
                                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                                      (Grupo: {catData.groupTotal.toFixed(2)} {project?.currency || '€'})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="divide-y divide-slate-800/40">
                                {catData.items.map((exp, idx) => renderExpenseItem(exp, idx))}
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
        </div>

        {/* Columna Derecha: Participantes */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Participantes ({project?.members?.length || 0})</span>
              </div>
            </h2>

            <form onSubmit={handleAddMember} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="amigo@correo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isInviting ? '...' : 'Añadir'}</span>
                </button>
              </div>

              {inviteMsg.text && (
                <p className={`text-xs mt-2 ${inviteMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {inviteMsg.text}
                </p>
              )}
            </form>

            <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto pr-1">
              {project?.members?.map((m, idx) => {
                const memberId = String(m?._id || m?.id || m);
                const ownerId = String(project?.owner?._id || project?.owner?.id || project?.owner);
                const isOwner = memberId === ownerId;
                const memberName = m?.name || `Usuario (${memberId.slice(-4)})`;
                const memberEmail = m?.email || 'Sin correo';

                return (
                  <div key={`member-list-${memberId}-${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center font-bold text-indigo-300 text-[11px]">
                        {memberName ? memberName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{memberName}</p>
                        <p className="text-[11px] text-slate-500">{memberEmail}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
                        <Crown className="w-3 h-3 text-amber-400" /> Creador
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}