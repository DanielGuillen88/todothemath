import { useState, useEffect } from 'react';
import { CreditCard, Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import ExpenseFields from './ExpenseFields';

export default function ExpenseForm({ project, currentUser, onSubmit }) {
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Otros',
    date: new Date().toISOString().split('T')[0],
    isPersonal: true,
    paidBy: currentUserId,
  });

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    if (project?.members) {
      setSelectedMembers(project.members.map((m) => m._id || m));
      if (!form.paidBy) {
        setForm((prev) => ({ ...prev, paidBy: currentUserId || project.members[0]?._id }));
      }
    }
  }, [project, currentUserId, form.paidBy]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    setFeedback(null);

    const numericAmount = Number(form.amount);

    if (!form.title.trim()) {
      setFeedback({ type: 'error', text: 'Debes indicar un concepto para el gasto.' });
      return;
    }

    if (!form.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setFeedback({ type: 'error', text: 'Introduce un importe válido mayor que 0.' });
      return;
    }

    if (!form.date) {
      setFeedback({ type: 'error', text: 'Debes seleccionar una fecha.' });
      return;
    }

    let splitPayload = [];
    if (!form.isPersonal && selectedMembers.length > 0) {
      const sharePerPerson = Number((numericAmount / selectedMembers.length).toFixed(2));
      splitPayload = selectedMembers.map((mId) => ({
        user: mId,
        share: sharePerPerson,
      }));
    }

    const payload = {
      title: form.title.trim(),
      amount: numericAmount,
      category: form.category,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      isPersonal: Boolean(form.isPersonal),
      paidBy: form.isPersonal ? currentUserId : (form.paidBy || currentUserId),
      splitBetween: form.isPersonal ? undefined : splitPayload,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);

      setFeedback({ type: 'success', text: 'Gasto registrado con éxito' });
      setForm({
        title: '',
        amount: '',
        category: 'Otros',
        date: new Date().toISOString().split('T')[0],
        isPersonal: true,
        paidBy: currentUserId,
      });

      if (project?.members) {
        setSelectedMembers(project.members.map((m) => m._id || m));
      }

      // Ocultar mensaje de éxito tras 2 segundos
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al registrar el gasto.',
      });
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

      {/* Si hay éxito, mostramos solo la tarjeta positiva y ocultamos el formulario temporalmente */}
      {feedback?.type === 'success' ? (
        <div className="py-6 px-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-sm font-medium animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{feedback.text}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {feedback?.type === 'error' && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <ExpenseFields
            values={form}
            onChange={handleFieldChange}
            project={project}
            currentUser={currentUser}
            disabled={isSubmitting}
            showSplitSelector={true}
            selectedMembers={selectedMembers}
            onToggleMember={toggleMemberSplit}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Registrar Gasto</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}