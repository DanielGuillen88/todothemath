import { Mail, Clock, Check, X } from 'lucide-react';
import { Button } from '../ui';

export default function PendingInvitationsList({
  invitations = [],
  actionRunningId,
  onAccept,
  onReject,
}) {
  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-amber-900/50 rounded-2xl p-5 mb-8 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-bold text-amber-300">
          Invitaciones pendientes ({invitations.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {invitations.map((proj) => {
          const pId = String(proj._id || proj.id);
          const isActionRunning = actionRunningId === pId;

          return (
            <div
              key={`pending-${pId}`}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{proj.title || proj.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Invitado por {proj.owner?.name || proj.owner?.email || 'Organizador'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={X}
                  disabled={isActionRunning}
                  onClick={() => onReject(pId)}
                  className="text-slate-400 hover:text-red-400 px-2.5 py-1 text-xs"
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  icon={Check}
                  isLoading={isActionRunning}
                  disabled={isActionRunning}
                  onClick={() => onAccept(pId)}
                  className="text-xs"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}