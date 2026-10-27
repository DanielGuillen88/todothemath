import { useState } from 'react';
import { Users, UserPlus, Crown, CheckCircle2, AlertCircle, UserMinus, AlertTriangle } from 'lucide-react';
import { Input, Button } from '../ui';
import { extractEntityId } from '../../utils/expenseHelpers';

export default function MemberList({ project, currentUser, onAddMember, onRemoveMember }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });

  // Estado del modal de confirmación
  const [targetMember, setTargetMember] = useState(null);
  const [projectNameConfirmation, setProjectNameConfirmation] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  // Extracción de identificadores
  const currentUserId = String(
    currentUser?._id || currentUser?.id || currentUser?.user?._id || currentUser?.user?.id || extractEntityId(currentUser) || ''
  );
  const currentUserEmail = String(
    currentUser?.email || currentUser?.user?.email || ''
  ).toLowerCase().trim();

  const ownerId = String(
    project?.owner?._id || project?.owner?.id || project?.owner || ''
  );
  const ownerEmail = String(
    project?.owner?.email || ''
  ).toLowerCase().trim();

  const isOwner = Boolean(
    (currentUserId && ownerId && currentUserId === ownerId) ||
    (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
  );

  const projectName = project?.name || project?.title || '';
  const isConfirmationMatching =
    projectNameConfirmation.trim().toLowerCase() === projectName.trim().toLowerCase();

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg({ text: '', type: '' });

    const emailToValidate = inviteEmail.trim().toLowerCase();
    if (!emailToValidate) {
      setInviteMsg({ type: 'error', text: 'Introduce el correo electrónico.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setInviteMsg({ type: 'error', text: 'Formato de correo no válido.' });
      return;
    }

    setIsInviting(true);
    try {
      await onAddMember(emailToValidate);
      setInviteMsg({ type: 'success', text: 'Participante añadido con éxito.' });
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

  const handleOpenRemoveModal = (member) => {
    setTargetMember(member);
    setProjectNameConfirmation('');
  };

  const handleCloseRemoveModal = () => {
    if (isRemoving) return;
    setTargetMember(null);
    setProjectNameConfirmation('');
  };

  const handleExecuteRemove = async () => {
    if (!isConfirmationMatching || !targetMember || !onRemoveMember) return;

    setIsRemoving(true);
    setInviteMsg({ text: '', type: '' });

    try {
      const memberId = extractEntityId(targetMember) || targetMember._id || targetMember.id;
      await onRemoveMember(memberId);
      setInviteMsg({ type: 'success', text: 'Participante expulsado del proyecto.' });
      handleCloseRemoveModal();
      setTimeout(() => setInviteMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setInviteMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error al expulsar al participante.',
      });
      handleCloseRemoveModal();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Participantes ({project?.members?.length || 0})</span>
        </div>
      </h2>

      {/* Formulario de invitación */}
      <form onSubmit={handleInvite} noValidate className="mb-4">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              type="email"
              disabled={isInviting || isRemoving}
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
            disabled={isRemoving}
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

      {/* Lista de Miembros */}
      <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto pr-1">
        {project?.members?.map((m, idx) => {
          const memberId = String(m?._id || m?.id || (typeof m === 'string' ? m : '') || extractEntityId(m));
          const memberEmail = String(m?.email || '').toLowerCase().trim();
          
          const isMemberOwner = Boolean(
            (ownerId && memberId && ownerId === memberId) ||
            (ownerEmail && memberEmail && ownerEmail === memberEmail)
          );

          const isCurrent = Boolean(
            (currentUserId && memberId && currentUserId === memberId) ||
            (currentUserEmail && memberEmail && currentUserEmail === memberEmail)
          );
          
          const baseName = m?.name || (memberEmail ? memberEmail.split('@')[0] : `Usuario (${memberId.slice(-4)})`);
          const canDeleteThisMember = isOwner && !isMemberOwner && !isCurrent;

          return (
            <div
              key={`member-list-${memberId || idx}`}
              className="py-2.5 flex items-center justify-between text-xs gap-2"
            >
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
                  <p className="text-[11px] text-slate-500 truncate">{m?.email || 'Sin correo'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isMemberOwner && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
                    <Crown className="w-3 h-3 text-amber-400" /> Creador
                  </span>
                )}

                {canDeleteThisMember && (
                  <button
                    type="button"
                    title="Expulsar del proyecto"
                    onClick={() => handleOpenRemoveModal(m)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación reforzada */}
      {targetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 rounded-lg bg-red-950/50 border border-red-900/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">¿Expulsar participante?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Estás a punto de expulsar a{' '}
              <strong className="text-white font-semibold">
                {targetMember.name || targetMember.email}
              </strong>{' '}
              del proyecto. Mejor Deshaz los pagos en la pestaña de liquidaciones primero.
            </p>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block">Escribe el nombre del proyecto para confirmar:</span>
              <span className="text-indigo-300 font-mono font-bold select-all">{projectName}</span>
            </div>

            <Input
              type="text"
              autoFocus
              placeholder="Nombre del proyecto..."
              value={projectNameConfirmation}
              onChange={(e) => setProjectNameConfirmation(e.target.value)}
              disabled={isRemoving}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseRemoveModal}
                disabled={isRemoving}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!isConfirmationMatching || isRemoving}
                isLoading={isRemoving}
                onClick={handleExecuteRemove}
              >
                Expulsar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}