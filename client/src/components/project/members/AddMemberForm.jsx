import { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input, Button } from '../../ui';

export default function AddMemberForm({ onAddMember, disabled }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const handleInvite = async (e) => {
    e.preventDefault();
    setFeedback({ text: '', type: '' });

    const emailToValidate = inviteEmail.trim().toLowerCase();
    if (!emailToValidate) {
      setFeedback({ type: 'error', text: 'Introduce el correo electrónico.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setFeedback({ type: 'error', text: 'Formato de correo no válido.' });
      return;
    }

    setIsInviting(true);
    try {
      await onAddMember(emailToValidate);
      setFeedback({ type: 'success', text: 'Invitación enviada. Pendiente de aceptación.' });
      setInviteEmail('');
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al añadir el participante.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <form onSubmit={handleInvite} noValidate className="mb-4">
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <Input
            type="email"
            disabled={isInviting || disabled}
            placeholder="amigo@correo.com"
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value);
              if (feedback.text) setFeedback({ text: '', type: '' });
            }}
          />
        </div>
        <Button
          type="submit"
          isLoading={isInviting}
          disabled={disabled}
          icon={UserPlus}
          className="shrink-0 h-[34px]"
        >
          Invitar
        </Button>
      </div>

      {feedback.text && (
        <div
          className={`mt-2.5 p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/40 border border-red-800/80 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </form>
  );
}