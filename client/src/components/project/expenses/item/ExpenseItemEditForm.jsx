import { AlertCircle, Check, X } from 'lucide-react';
import { ExpenseFields } from '../form';
import { Button } from '../../../ui';

export default function ExpenseItemEditForm({
  editForm,
  onFieldChange,
  project,
  currentUser,
  isProcessing,
  selectedMembers,
  onToggleMember,
  actionFeedback,
  isConfirmingSave,
  onStartConfirmSave,
  onCancelConfirmSave,
  onSave,
  onCancelEditing,
}) {
  return (
    <div className="p-3.5 my-1.5 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3">
      {actionFeedback?.type === 'error' && (
        <div className="p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium bg-red-950/40 border border-red-800/80 text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{actionFeedback.text}</span>
        </div>
      )}

      <ExpenseFields
        values={editForm}
        onChange={onFieldChange}
        project={project}
        currentUser={currentUser}
        disabled={isProcessing}
        showSplitSelector={!editForm.isPersonal}
        selectedMembers={selectedMembers}
        onToggleMember={onToggleMember}
      />

      <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
        {isConfirmingSave ? (
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/60 px-2.5 py-1 rounded-lg">
            <span className="text-xs text-indigo-200 font-medium mr-1">¿Guardar cambios?</span>
            <Button
              size="sm"
              variant="primary"
              isLoading={isProcessing}
              icon={Check}
              onClick={onSave}
              className="bg-emerald-600 hover:bg-emerald-500"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={isProcessing}
              icon={X}
              onClick={onCancelConfirmSave}
            />
          </div>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              disabled={isProcessing}
              icon={X}
              onClick={onCancelEditing}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={isProcessing}
              icon={Check}
              onClick={onStartConfirmSave}
            >
              Guardar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}