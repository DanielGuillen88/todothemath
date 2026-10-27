import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, updateProjectById } from '../services/projectService';
import { FolderKanban, Plus, X, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui';
import ProjectCard from '../components/project/ProjectCard';
import DeleteProjectModal from '../components/project/DeleteProjectModal';
import ProjectFormFields from '../components/project/ProjectFormFields';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modal de edición
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: '',
    currency: 'EUR',
    type: 'trip',
    // settlementMode: 'direct',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);

  // Estado para toast de éxito
  const [toastMessage, setToastMessage] = useState(null);

  // Estado para modal de eliminación
  const [deletingProject, setDeletingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      const list = res.data?.data?.projects || res.data?.projects || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Timer para limpiar el toast automáticamente
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const openEditModal = (p) => {
    const projectId = String(p?._id || p?.id || '');
    setEditingProject({ ...p, resolvedId: projectId });
    setEditForm({
      title: p.title || p.name || '',
      description: p.description || '',
      budget: p.budget !== undefined && p.budget !== null ? p.budget : '',
      currency: p.currency || 'EUR',
      type: p.type || 'trip',
      // settlementMode: p.settlementMode || 'direct',
    });
    setErrorMsg('');
    setIsConfirmingSave(false);
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setIsConfirmingSave(false);
    setErrorMsg('');
  };

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (isConfirmingSave) setIsConfirmingSave(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    if (!isConfirmingSave) {
      setIsConfirmingSave(true);
      return;
    }

    const targetId = editingProject?.resolvedId || editingProject?._id || editingProject?.id;
    if (!targetId || targetId === 'undefined') return;

    setIsUpdating(true);
    setErrorMsg('');

    try {
      await updateProjectById(targetId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        budget: editForm.budget !== '' ? Number(editForm.budget) : 0,
        currency: editForm.currency,
        type: editForm.type || 'trip',
        // settlementMode: editForm.settlementMode || 'direct',
      });

      const updatedTitle = editForm.title.trim();
      closeEditModal();
      await fetchProjects();
      setToastMessage(`Proyecto "${updatedTitle}" actualizado con éxito`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el proyecto');
      setIsConfirmingSave(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletedSuccess = (deletedId) => {
    setProjects((prev) => prev.filter((p) => String(p._id || p.id) !== String(deletedId)));
    setDeletingProject(null);
    setToastMessage('Proyecto eliminado correctamente');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Mis Proyectos</h1>
          <p className="text-slate-400 text-sm mt-1">Gestiona los eventos que has creado o en los que participas.</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Proyecto</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-medium text-white mb-1">Aún no tienes ningún proyecto</p>
          <p className="text-xs text-slate-500 mb-6">Crea uno nuevo o pide a un amigo que te invite por correo.</p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear mi primer proyecto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, idx) => (
            <ProjectCard
              key={p?._id || p?.id || idx}
              project={p}
              currentUser={user}
              onEdit={openEditModal}
              onDeleteClick={setDeletingProject}
            />
          ))}
        </div>
      )}

      {/* Modal Reutilizable de Eliminación */}
      <DeleteProjectModal
        project={deletingProject}
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onSuccess={handleDeletedSuccess}
      />

      {/* Modal de Edición con campos compartidos y confirmación */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={closeEditModal}
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
                values={editForm}
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
                        closeEditModal();
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
      )}
    </div>
  );
}