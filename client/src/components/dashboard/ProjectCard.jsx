import { Link } from 'react-router-dom';
import { Crown, Users, Pencil, Trash2, CreditCard } from 'lucide-react';
import { extractEntityId } from '../../utils/expenseHelpers';

export default function ProjectCard({ project, currentUser, onEdit, onDeleteClick }) {
  const projectId = String(project?._id || project?.id || '');
  const title = project?.title || project?.name || 'Sin título';

  const currentUserId = String(
    currentUser?._id || currentUser?.id || currentUser?.user?._id || extractEntityId(currentUser) || ''
  );
  const currentUserEmail = String(
    currentUser?.email || currentUser?.user?.email || ''
  ).toLowerCase().trim();

  const rawOwner = project?.owner;
  const ownerId = String(typeof rawOwner === 'string' ? rawOwner : rawOwner?._id || rawOwner?.id || '');
  const ownerEmail = String(rawOwner?.email || '').toLowerCase().trim();

  const isOwner = Boolean(
    (currentUserId && ownerId && currentUserId === ownerId) ||
    (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {isOwner ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2.5 py-0.5 rounded-full">
              <Crown className="w-3 h-3 text-amber-400" /> Creador
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-0.5 rounded-full">
              <Users className="w-3 h-3 text-indigo-400" /> Invitado
            </span>
          )}

          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(project)}
                title="Editar detalles del proyecto"
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteClick(project)}
                title="Eliminar proyecto"
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <Link to={`/projects/${projectId}`} className="block group-hover:text-indigo-400 transition-colors">
          <h2 className="text-lg font-bold text-white tracking-tight line-clamp-1">{title}</h2>
        </Link>
        <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 min-h-[32px]">
          {project?.description || 'Sin descripción detallada.'}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          <span>Presupuesto:</span>
          <span className="font-semibold text-white">
            {project?.budget ? `${project.budget} ${project?.currency || '€'}` : 'Sin límite'}
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
}