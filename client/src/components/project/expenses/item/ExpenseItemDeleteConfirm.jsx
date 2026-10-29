import { Check, X } from 'lucide-react';
import { Button } from '../../../ui';

export default function ExpenseItemDeleteConfirm({
  isProcessing,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-950/90 border border-red-900/60 px-2.5 py-1.5 rounded-lg shadow-inner">
      <span className="text-xs text-red-300 font-medium mr-1">¿Eliminar?</span>
      <Button
        size="sm"
        variant="danger"
        isLoading={isProcessing}
        icon={Check}
        onClick={onConfirm}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={isProcessing}
        icon={X}
        onClick={onCancel}
      />
    </div>
  );
}