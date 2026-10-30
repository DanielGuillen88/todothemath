import { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui';
import ProjectFormFields from './ProjectFormFields';
import { updateProjectById } from '../../services/projectService';

export default function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    currency: 'EUR',
    type: 'trip',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || project.name || '',
        description: project.description || '',
        budget: project.budget !== undefined && project.budget !== null ? project.budget : '',
        currency: project.currency || 'EUR',
        type: project.type || 'trip',
      });
      setErrorMsg('');
      setIsConfirmingSave(false);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (isConfirmingSave) setIsConfirmingSave(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (!isConfirmingSave) {
      setIsConfirmingSave(true);
      return;
    }

    const targetId = project.resolvedId || project._id || project.id;
    if (!targetId || targetId === 'undefined') return;

    setIsUpdating(true);
    setErrorMsg('');

    try {
      await updateProjectById(targetId, {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget !== '' ? Number(form.budget) : 0,
        currency: form.currency,
        type: form.type || 'trip',
      });

      onSuccess(form.title.trim());
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el proyecto');
      setIsConfirmingSave(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">Editar Proyecto</h3>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <ProjectFormFields
            values={form}
            onChange={handleFieldChange}
            disabled={isUpdating}
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              {isConfirmingSave && (
                <span className="text-xs text-amber-400 font-medium">
                  Pulsa de nuevo para aplicar los cambios
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (isConfirmingSave) {
                    setIsConfirmingSave(false);
                  } else {
                    onClose();
                  }
                }}
                disabled={isUpdating}
              >
                {isConfirmingSave ? 'Volver' : 'Cancelar'}
              </Button>

              <Button
                type="submit"
                size="sm"
                isLoading={isUpdating}
                className={
                  isConfirmingSave
                    ? '!bg-amber-600 hover:!bg-amber-500 !text-white'
                    : ''
                }
                icon={isConfirmingSave ? Check : undefined}
              >
                {isConfirmingSave ? '¿Confirmar cambios?' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}