import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input, Button } from '../ui';
import { deleteProjectById } from '../../services/projectService';

export default function DeleteProjectModal({ project, isOpen, onClose, onSuccess }) {
  const [confirmationName, setConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !project) return null;

  const projectTitle = project.title || project.name || '';
  const isMatch = confirmationName.trim().toLowerCase() === projectTitle.trim().toLowerCase();

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmationName('');
    setErrorMsg('');
    onClose();
  };

  const handleDelete = async (e) => {
    if (e) e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const projectId = project._id || project.id;
      await deleteProjectById(projectId, confirmationName.trim());
      handleClose();
      if (onSuccess) onSuccess(projectId);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al eliminar el proyecto.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-red-400">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-900/60 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">¿Eliminar proyecto definitivamente?</h3>
            <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Se borrarán de forma irreversible todos los gastos registrados, participantes y saldos de{' '}
          <strong className="text-white font-semibold">{projectTitle}</strong>.
        </p>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
          <span className="text-slate-400 block">Escribe el nombre del proyecto para confirmar:</span>
          <span className="text-indigo-300 font-mono font-bold text-sm block select-all">
            {projectTitle}
          </span>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <Input
            type="text"
            autoFocus
            placeholder="Nombre del proyecto..."
            value={confirmationName}
            onChange={(e) => {
              setConfirmationName(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            disabled={isDeleting}
          />

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={!isMatch || isDeleting}
              isLoading={isDeleting}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}