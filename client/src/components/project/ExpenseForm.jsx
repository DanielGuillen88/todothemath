import { useState, useEffect } from 'react';
import { CreditCard, Plus, AlertCircle } from 'lucide-react';

export default function ExpenseForm({ project, currentUser, onSubmit }) {
  
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Otros');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPersonal, setIsPersonal] = useState(true);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project?.members) {
      setSelectedMembers(project.members.map((m) => m._id || m));
      if (!paidBy) {
        setPaidBy(currentUserId || project.members[0]?._id);
      }
    }
  }, [project, currentUserId, paidBy]);

  const toggleMemberSplit = (memberId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSubmit = async (e) => {
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
      splitPayload = selectedMembers.map((mId) => ({
        user: mId,
        share: sharePerPerson,
      }));
    }

    const payload = {
      title: title.trim(),
      amount: numericAmount,
      category,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      isPersonal: Boolean(isPersonal),
      paidBy: isPersonal ? currentUserId : (paidBy || currentUserId),
      splitBetween: isPersonal ? undefined : splitPayload,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      setTitle('');
      setAmount('');
      setCategory('Otros');
      setDate(new Date().toISOString().split('T')[0]);
      setIsPersonal(true);
      setPaidBy(currentUserId);
      if (project?.members) {
        setSelectedMembers(project.members.map((m) => m._id || m));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Importe ({project?.currency || '€'})
          </label>
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
            <option value="Otros">Otros</option>
            <option value="Ocio">Ocio</option>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Alojamiento">Alojamiento</option>
            <option value="Supermercado">Supermercado</option>
            <option value="Personales">Personales</option>
          </select>
        </div>

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
                    {memberName} {isCurrent ? '(Mí)' : ''} {isOwner ? '👑' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

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

        {!isPersonal && project?.members && project.members.length > 1 && (
          <div className="sm:col-span-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Dividir gasto entre:</span>
              <span className="text-[11px] text-indigo-400">
                {selectedMembers.length} seleccionados (
                {Number(amount ? (Number(amount) / selectedMembers.length).toFixed(2) : 0)}{' '}
                {project.currency}/persona)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.members.map((m, idx) => {
                const memberId = String(m?._id || m?.id || m);
                const isIncluded = selectedMembers.some((mid) => String(mid) === memberId);
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
  );
}