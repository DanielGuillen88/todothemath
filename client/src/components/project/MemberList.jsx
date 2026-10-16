import { useState } from 'react';
import { Users, UserPlus, Crown } from 'lucide-react';

export default function MemberList({ project, onAddMember }) {
    
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteMsg({ text: '', type: '' });

    try {
      await onAddMember(inviteEmail.trim().toLowerCase());
      setInviteMsg({ text: 'Participante añadido con éxito.', type: 'success' });
      setInviteEmail('');
    } catch (err) {
      setInviteMsg({
        text: err.response?.data?.message || 'Error al añadir el participante.',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
      setTimeout(() => setInviteMsg({ text: '', type: '' }), 4000);
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

      <form onSubmit={handleInvite} className="mb-4">
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
  );
}