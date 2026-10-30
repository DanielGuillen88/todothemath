import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui';
import { DeleteProjectModal } from '../dashboard';
import { extractEntityId } from '../../utils/expenseHelpers';

export default function ProjectHeader({ project, metrics, currentUser }) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const currentUserId = String(
    currentUser?._id ||
    currentUser?.id ||
    currentUser?.user?._id ||
    currentUser?.user?.id ||
    currentUser?.data?.user?._id ||
    extractEntityId(currentUser) ||
    ''
  ).trim();

  const currentUserEmail = String(
    currentUser?.email ||
    currentUser?.user?.email ||
    currentUser?.data?.user?.email ||
    ''
  ).toLowerCase().trim();

  const rawOwner = project?.owner;
  const ownerId = String(typeof rawOwner === 'string' ? rawOwner : rawOwner?._id || rawOwner?.id || '').trim();
  const ownerEmail = String(rawOwner?.email || '').toLowerCase().trim();

  const isOwner = Boolean(
    (currentUserId && ownerId && currentUserId === ownerId) ||
    (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)
  );

  const currency = project?.currency || '€';

  const myPersonal = Number(metrics?.myPersonal) || 0;
  const myTotalShare = Number(metrics?.myTotalShare) || 0;
  const myRealTotal = Number(metrics?.myRealTotal) || (myPersonal + myTotalShare);
  const netBalance = Number(metrics?.myNetBalance) || 0;

  // Disponible = Presupuesto - Tu Coste Real
  const projectBudget = Number(project?.budget || 0);
  const budgetRemaining = projectBudget > 0 
    ? Number((projectBudget - myRealTotal).toFixed(2)) 
    : null;

  // Etiqueta y texto dinámico para deudas directas
  const balanceLabel = netBalance > 0.01 
    ? 'Te deben' 
    : netBalance < -0.01 
    ? 'Debes' 
    : 'Al día';

  const balanceDisplay = netBalance > 0.01
    ? `+${netBalance.toFixed(0)} ${currency}`
    : netBalance < -0.01
    ? `${Math.abs(netBalance).toFixed(0)} ${currency}`
    : '💪🏻🤑';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Información del Proyecto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-900/50">
              {project?.type || 'General'}
            </span>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setIsDeleteOpen(true)}
                title="Eliminar este proyecto"
                className="text-slate-500 hover:text-red-400 hover:bg-red-950/20 px-1.5 py-1"
              />
            )}

            <DeleteProjectModal
              project={project}
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              onSuccess={() => navigate('/')}
            />

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowDescription((prev) => !prev)}
            className="group flex items-center gap-2 text-left focus:outline-hidden cursor-pointer"
            title="Haz clic para ver o esconder la descripción"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
              {project?.title || project?.name}
            </h1>
            <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">
              {showDescription ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100" />
              )}
            </span>
          </button>

          {showDescription && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-slate-400 text-sm leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 max-w-xl">
                {project?.description?.trim() ? project.description : 'Este proyecto no tiene descripción.'}
              </p>
            </div>
          )}
        </div>

        {/* Panel de Métricas Financieras */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-950 px-5 py-3.5 rounded-xl border border-slate-800">
          {/* 1. Personales */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Personales</p>
            <p className="text-base sm:text-lg font-bold text-amber-400">
              {myPersonal.toFixed(0)} {currency}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

          {/* 2. Compartidos (Tu cuota consumida) */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Compartidos</p>
            <p className="text-base sm:text-lg font-bold text-indigo-300">
              {myTotalShare.toFixed(0)} {currency}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

          {/* 3. Tu Coste Real = Personales + Compartidos */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-base sm:text-lg font-bold text-white">
              {myRealTotal.toFixed(0)} {currency}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

          {/* 4. Estado de Deuda bilateral: Te deben / Debes / Al día */}
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {balanceLabel}
            </p>
            <p
              className={`text-base sm:text-lg font-bold ${
                netBalance > 0.01
                  ? 'text-emerald-400'
                  : netBalance < -0.01
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            >
              {balanceDisplay}
            </p>
          </div>

          {/* 5. Presupuesto Disponible = Presupuesto - Tu Coste Real */}
          {projectBudget > 0 && (
            <>
              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Disponible</p>
                <p
                  className={`text-base sm:text-lg font-bold ${
                    budgetRemaining < 0 ? 'text-red-400' : 'text-emerald-300'
                  }`}
                >
                  {budgetRemaining.toFixed(0)} {currency}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}