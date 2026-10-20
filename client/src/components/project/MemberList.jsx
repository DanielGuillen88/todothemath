import { useState } from 'react';
import { Users, UserPlus, Crown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input, Button } from '../ui';

export default function MemberList({ project, onAddMember }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg({ text: '', type: '' });

    const emailToValidate = inviteEmail.trim().toLowerCase();

    if (!emailToValidate) {
      setInviteMsg({
        type: 'error',
        text: '🙏🏻 Por favor, introduce el correo electrónico del participante.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setInviteMsg({
        type: 'error',
        text: '😵 Introduce un formato de correo electrónico válido.',
      });
      return;
    }

    setIsInviting(true);

    try {
      await onAddMember(emailToValidate);
      setInviteMsg({
        type: 'success',
        text: '✅ Participante añadido con éxito.',
      });
      setInviteEmail('');
      setTimeout(() => setInviteMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setInviteMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error al añadir el participante.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Participantes ({project?.members?.length || 0})</span>
        </div>
      </h2>

      <form onSubmit={handleInvite} noValidate className="mb-4">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              type="email"
              disabled={isInviting}
              placeholder="amigo@correo.com"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (inviteMsg.text) setInviteMsg({ text: '', type: '' });
              }}
            />
          </div>
          <Button
            type="submit"
            isLoading={isInviting}
            icon={UserPlus}
            className="shrink-0 h-[34px]"
          >
            Añadir
          </Button>
        </div>

        {inviteMsg.text && (
          <div
            className={`mt-2.5 p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
              inviteMsg.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/40 border border-red-800/80 text-red-300'
            }`}
          >
            {inviteMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{inviteMsg.text}</span>
          </div>
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
  );
}