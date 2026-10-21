import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import DeleteProjectModal from './DeleteProjectModal';
import { extractEntityId } from '../../utils/expenseHelpers';

export default function ProjectHeader({ project, metrics, currentUser }) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-900/50">
              {project?.type || 'General'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {project?.title || project?.name}
          </h1>
          <p className="text-slate-400 text-sm">{project?.description || 'Sin descripción'}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-slate-400 font-medium">Personales</p>
              <p className="text-base sm:text-lg font-bold text-slate-200">
                {metrics?.myPersonal?.toFixed(2) ?? '0.00'}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total</p>
              <p className="text-base sm:text-lg font-bold text-emerald-400">
                {metrics?.myRealTotal?.toFixed(2) ?? '0.00'}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Presupuesto</p>
              <p className="text-base sm:text-lg font-bold text-indigo-400">
                {project?.budget ? `${project.budget} ${project?.currency || '€'}` : 'Sin límite'}
              </p>
            </div>
          </div>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteOpen(true)}
              title="Eliminar este proyecto"
              className="text-slate-500 hover:text-red-400 hover:bg-red-950/20 shrink-0 self-end sm:self-center"
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <DeleteProjectModal
        project={project}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={() => navigate('/')}
      />
    </div>
  );
}