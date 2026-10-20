import { useState, useEffect } from 'react';
import { CreditCard, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import ExpenseFields from './ExpenseFields';
import { Button } from '../ui';
import { extractEntityId, buildCreateExpensePayload } from '../../utils/expenseHelpers';

export default function ExpenseForm({ project, currentUser, onSubmit }) {
  const currentUserId = extractEntityId(currentUser);

  const getInitialForm = () => ({
    title: '',
    amount: '',
    category: 'Otros',
    date: new Date().toISOString().split('T')[0],
    isPersonal: true,
    paidBy: currentUserId,
  });

  const [form, setForm] = useState(getInitialForm);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (project?.members) {
      setSelectedMembers(project.members.map((m) => extractEntityId(m)));
      if (!form.paidBy) {
        setForm((prev) => ({
          ...prev,
          paidBy: currentUserId || extractEntityId(project.members[0]),
        }));
      }
    }
  }, [project, currentUserId, form.paidBy]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMemberSplit = (memberId) => {
    setSelectedMembers((prev) => {
      const cleanId = extractEntityId(memberId);
      if (prev.includes(cleanId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== cleanId);
      }
      return [...prev, cleanId];
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

    const payload = buildCreateExpensePayload(form, selectedMembers, currentUserId);

    setIsSubmitting(true);
    try {
      await onSubmit(payload);

      setFeedback({ type: 'success', text: 'Gasto registrado con éxito' });
      setForm(getInitialForm());

      if (project?.members) {
        setSelectedMembers(project.members.map((m) => extractEntityId(m)));
      }

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

      {feedback?.type === 'success' ? (
        <div className="py-6 px-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 text-sm font-medium animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{feedback.text}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {feedback?.type === 'error' && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
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
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={Plus}
            >
              Registrar Gasto
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}