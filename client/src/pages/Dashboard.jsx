import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, updateProjectById } from '../services/projectService';
import { FolderKanban, Plus, X, AlertCircle } from 'lucide-react';
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
    settlementMode: 'direct',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const openEditModal = (p) => {
    const projectId = String(p?._id || p?.id || '');
    setEditingProject({ ...p, resolvedId: projectId });
    setEditForm({
      title: p.title || p.name || '',
      description: p.description || '',
      budget: p.budget !== undefined && p.budget !== null ? p.budget : '',
      currency: p.currency || 'EUR',
      type: p.type || 'trip',
      settlementMode: p.settlementMode || 'direct',
    });
    setErrorMsg('');
  };

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

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
        settlementMode: editForm.settlementMode || 'direct',
      });
      setEditingProject(null);
      await fetchProjects();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el proyecto');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletedSuccess = (deletedId) => {
    setProjects((prev) => prev.filter((p) => String(p._id || p.id) !== String(deletedId)));
    setDeletingProject(null);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Modal de Edición con campos compartidos */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setEditingProject(null)}
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingProject(null)}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isUpdating}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}