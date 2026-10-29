import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input, Button } from '../../ui';
import { extractEntityId } from '../../../utils/expenseHelpers';

export default function RemoveMemberModal({
  targetMember,
  projectName,
  onClose,
  onConfirmRemove,
}) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  if (!targetMember) return null;

  const isMatching =
    confirmationInput.trim().toLowerCase() === String(projectName || '').trim().toLowerCase();

  const handleExecute = async () => {
    if (!isMatching || isRemoving) return;

    setIsRemoving(true);
    try {
      const memberUserData = targetMember?.user || targetMember;
      const memberId = extractEntityId(memberUserData) || memberUserData._id || memberUserData.id;
      await onConfirmRemove(memberId);
      onClose();
    } catch {
      // El mensaje de error lo captura el orquestador
    } finally {
      setIsRemoving(false);
    }
  };

  const displayName =
    targetMember?.user?.name ||
    targetMember?.user?.email ||
    targetMember?.name ||
    targetMember?.email ||
    'este participante';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2.5 text-red-400">
          <div className="p-2 rounded-lg bg-red-950/50 border border-red-900/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">¿Expulsar participante?</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Estás a punto de expulsar a <strong className="text-white font-semibold">{displayName}</strong> del proyecto.
        </p>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 block">Escribe el nombre del proyecto para confirmar:</span>
          <span className="text-indigo-300 font-mono font-bold select-all">{projectName}</span>
        </div>

        <Input
          type="text"
          autoFocus
          placeholder="Nombre del proyecto..."
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          disabled={isRemoving}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isRemoving}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!isMatching || isRemoving}
            isLoading={isRemoving}
            onClick={handleExecute}
          >
            Expulsar
          </Button>
        </div>
      </div>
    </div>
  );
}