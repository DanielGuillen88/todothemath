import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  Calendar, 
  CreditCard, 
  Crown, 
  Users, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const currentUserId = String(user?._id || user?.id || user?.user?._id || user?.user?.id || '');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Estado para el modal de edición
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: '',
    currency: 'EUR'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
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

  // Confirmar y eliminar proyecto
  // const handleDelete = async (projectId) => {
  //   try {
  //     await api.delete(`/projects/${projectId}`);
  //     setDeletingId(null);
  //     setProjects(prev => prev.filter(p => p._id !== projectId));
  //   } catch (err) {
  //     console.error('Error al eliminar proyecto:', err);
  //     alert(err.response?.data?.message || 'Error al eliminar el proyecto');
  //     setDeletingId(null);
  //   }
  // };

  // Confirmar y eliminar proyecto
  const handleDelete = async (projectId) => {
    if (!projectId || projectId === 'undefined') return;

    try {
      await api.delete(`/projects/${projectId}`);
      
      // 1. Quitar la tarjeta inmediatamente del estado local (comparación segura como String)
      setProjects((prev) =>
        prev.filter((p) => {
          const currentId = String(p?._id || p?.id || '');
          return currentId !== String(projectId);
        })
      );
      
      setDeletingId(null);

      // 2. Sincronizar en segundo plano con el backend
      await fetchProjects();
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      alert(err.response?.data?.message || 'Error al eliminar el proyecto');
      setDeletingId(null);
    }
  };

  // Abrir modal de edición extrayendo de forma segura el ID
  const openEditModal = (p) => {
    const projectId = String(p?._id || p?.id || '');
    setEditingProject({ ...p, resolvedId: projectId });
    setEditForm({
      title: p.title || '',
      description: p.description || '',
      budget: p.budget !== undefined && p.budget !== null ? p.budget : '',
      currency: p.currency || 'EUR',
      type: p.type || 'trip',
    });
    setErrorMsg('');
  };

  // Guardar edición
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    const targetId = editingProject?.resolvedId || editingProject?._id || editingProject?.id;
    if (!targetId || targetId === 'undefined') {
      setErrorMsg('No se pudo identificar el ID del proyecto.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');

    try {
      await api.put(`/projects/${targetId}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        budget: editForm.budget !== '' ? Number(editForm.budget) : 0,
        currency: editForm.currency,
        type: editForm.type || 'trip',
      });

      setEditingProject(null);
      await fetchProjects();
    } catch (err) {
      console.error('Error al actualizar el proyecto:', err);
      setErrorMsg(err.response?.data?.message || 'Error al actualizar el proyecto');
    } finally {
      setIsUpdating(false);
    }
  };

  // Clasificación: ¿Soy el dueño?
  const isOwner = (project) => {
    const ownerId = String(project.owner?._id || project.owner?.id || project.owner || '');
    return ownerId === currentUserId;
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
      {/* Cabecera */}
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

      {/* Lista de Tarjetas */}
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
          {projects.map((p, idx) => {
            const projectId = String(p?._id || p?.id || `proj-${idx}`);
            const userIsOwner = isOwner(p);
            const isConfirmingDelete = deletingId === projectId;

            return (
              <div
                key={projectId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Fila superior: Rol y Acciones */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {userIsOwner ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2.5 py-0.5 rounded-full">
                        <Crown className="w-3 h-3 text-amber-400" /> Creador
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-indigo-400" /> Invitado
                      </span>
                    )}

                    {/* Botones de acción: SOLO si es el Creador */}
                    {userIsOwner && (
                      <div className="flex items-center gap-1">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5 bg-slate-950 border border-red-900/60 px-2 py-1 rounded-lg">
                            <span className="text-[11px] text-red-300 font-medium">¿Borrar?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(projectId)}
                              title="Confirmar eliminación"
                              className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              title="Cancelar"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              title="Editar proyecto"
                              className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(projectId)}
                              title="Eliminar proyecto"
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Título y Descripción */}
                  <Link to={`/projects/${projectId}`} className="block group-hover:text-indigo-400 transition-colors">
                    <h2 className="text-lg font-bold text-white tracking-tight line-clamp-1">{p.title}</h2>
                  </Link>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 min-h-[32px]">
                    {p.description || 'Sin descripción detallada.'}
                  </p>
                </div>

                {/* Pie de la tarjeta */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Presupuesto:</span>
                    <span className="font-semibold text-white">
                      {p.budget ? `${p.budget} ${p.currency || '€'}` : 'Sin límite'}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${projectId}`}
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Editar Proyecto */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
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
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Título del Proyecto</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Presupuesto</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    placeholder="Opcional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Moneda</label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}