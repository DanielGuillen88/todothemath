import { Calendar } from 'lucide-react';

export default function ProjectHeader({ project, metrics }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-900/50">
              {project?.type || 'General'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project?.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{project?.description || 'Sin descripción'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 self-start sm:self-auto">
          <div>
            <p className="text-xs text-slate-400 font-medium">Personales</p>
            <p className="text-base sm:text-lg font-bold text-slate-200">
              {metrics.myPersonal.toFixed(2)} {project?.currency || '€'}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

          <div>
            <p className="text-xs text-slate-400 font-medium">Total</p>
            <p className="text-base sm:text-lg font-bold text-emerald-400">
              {metrics.myRealTotal.toFixed(2)} {project?.currency || '€'}
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
      </div>
    </div>
  );
}