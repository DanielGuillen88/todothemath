import { Crown, Clock, UserMinus } from 'lucide-react';
import { extractEntityId } from '../../../utils/expenseHelpers';

export default function MemberItem({
  member,
  ownerId,
  ownerEmail,
  currentUserId,
  currentUserEmail,
  isOwner,
  onOpenRemoveModal,
}) {
  const memberUser = member?.user || member;
  const memberId = String(
    memberUser?._id || memberUser?.id || (typeof memberUser === 'string' ? memberUser : '') || extractEntityId(memberUser)
  ).trim();

  const memberEmail = String(memberUser?.email || '').toLowerCase().trim();
  const memberStatus = member?.status || 'accepted';

  const isMemberOwner = Boolean(
    (ownerId && memberId && ownerId === memberId) ||
    (ownerEmail && memberEmail && ownerEmail === memberEmail)
  );

  const isCurrent = Boolean(
    (currentUserId && memberId && currentUserId === memberId) ||
    (currentUserEmail && memberEmail && currentUserEmail === memberEmail)
  );

  const baseName = memberUser?.name || (memberEmail ? memberEmail.split('@')[0] : `Usuario (${memberId.slice(-4)})`);
  const canDeleteThisMember = isOwner && !isMemberOwner && !isCurrent;

  return (
    <div className="py-2.5 flex items-center justify-between text-xs gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center font-bold text-indigo-300 text-[11px] shrink-0">
          {baseName ? baseName.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white truncate flex items-center gap-1.5">
            <span>{baseName}</span>
            {isCurrent && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                Tú
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-500 truncate">{memberUser?.email || 'Sin correo'}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isMemberOwner ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
            <Crown className="w-3 h-3 text-amber-400" /> Creador
          </span>
        ) : memberStatus === 'pending' ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5" /> Pendiente
          </span>
        ) : (
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2 py-0.5 rounded-full">
            Activo
          </span>
        )}

        {canDeleteThisMember && (
          <button
            type="button"
            title={memberStatus === 'pending' ? 'Cancelar invitación' : 'Expulsar del proyecto'}
            onClick={() => onOpenRemoveModal(member)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}