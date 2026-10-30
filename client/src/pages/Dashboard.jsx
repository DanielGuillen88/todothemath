import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardProjects } from '../hooks/useDashboardProjects';
import { FolderKanban, Plus, X, CheckCircle2 } from 'lucide-react';
import { ProjectCard, DeleteProjectModal, EditProjectModal, PendingInvitationsList } from '../components/dashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    loading,
    pendingInvitations,
    activeProjects,
    toastMessage,
    setToastMessage,
    invitationActionId,
    fetchProjects,
    handleAcceptInvite,
    handleRejectInvite,
    removeProjectFromList,
  } = useDashboardProjects(user);

  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const openEditModal = (p) => {
    setEditingProject({ ...p, resolvedId: String(p?._id || p?.id || '') });
  };

  const handleEditSuccess = async (title) => {
    await fetchProjects();
    setToastMessage(`Proyecto "${title}" actualizado con éxito`);
  };

  const handleDeleteSuccess = (deletedId) => {
    removeProjectFromList(deletedId);
    setDeletingProject(null);
    setToastMessage('Proyecto eliminado correctamente');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Toast Flotante */}
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

      {/* Cabecera Principal */}
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

      {/* Invitaciones Pendientes */}
      <PendingInvitationsList
        invitations={pendingInvitations}
        actionRunningId={invitationActionId}
        onAccept={handleAcceptInvite}
        onReject={handleRejectInvite}
      />

      {/* Proyectos Activos */}
      {activeProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-medium text-white mb-1">Aún no tienes ningún proyecto activo</p>
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
          {activeProjects.map((p, idx) => (
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

      {/* Modales */}
      <DeleteProjectModal
        project={deletingProject}
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onSuccess={handleDeleteSuccess}
      />

      <EditProjectModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}