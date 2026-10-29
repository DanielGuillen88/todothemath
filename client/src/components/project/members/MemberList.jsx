import { useState } from 'react';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
import AddMemberForm from './AddMemberForm';
import MemberItem from './MemberItem';
import RemoveMemberModal from './RemoveMemberModal';
import { extractEntityId } from '../../../utils/expenseHelpers';

export default function MemberList({ project, currentUser, onAddMember, onRemoveMember }) {
  const [targetMember, setTargetMember] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Identificadores y rol de owner
  const currentUserId = String(
    currentUser?._id || currentUser?.id || currentUser?.user?._id || currentUser?.user?.id || extractEntityId(currentUser) || ''
  ).trim();

  const currentUserEmail = String(
    currentUser?.email || currentUser?.user?.email || ''
  ).toLowerCase().trim();

  const ownerId = String(
    project?.owner?._id || project?.owner?.id || project?.owner || ''
  ).trim();

  const ownerEmail = String(project?.owner?.email || '').toLowerCase().trim();

  const isOwner = Boolean(
    (currentUserId && ownerId && currentUserId === ownerId) ||
    (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
  );

  const projectName = project?.name || project?.title || '';

  const handleRemoveConfirm = async (memberId) => {
    try {
      await onRemoveMember(memberId);
      setFeedback({ type: 'success', text: 'Participante expulsado del proyecto.' });
      setTimeout(() => setFeedback({ text: '', type: '' }), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error al expulsar al participante.',
      });
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
      throw err;
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

      {feedback.text && (
        <div
          className={`mb-4 p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
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

      {/* Formulario de invitación */}
      {isOwner && (
        <AddMemberForm
          onAddMember={onAddMember}
          disabled={Boolean(targetMember)}
        />
      )}

      {/* Lista de Miembros */}
      <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto pr-1">
        {project?.members?.map((m, idx) => (
          <MemberItem
            key={`member-row-${extractEntityId(m?.user || m) || idx}`}
            member={m}
            ownerId={ownerId}
            ownerEmail={ownerEmail}
            currentUserId={currentUserId}
            currentUserEmail={currentUserEmail}
            isOwner={isOwner}
            onOpenRemoveModal={setTargetMember}
          />
        ))}
      </div>

      {/* Modal de confirmación para expulsar */}
      <RemoveMemberModal
        targetMember={targetMember}
        projectName={projectName}
        onClose={() => setTargetMember(null)}
        onConfirmRemove={handleRemoveConfirm}
      />
    </div>
  );
}