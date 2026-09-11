import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  titulo: string;
  descricao: string;
  labelConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  titulo,
  descricao,
  labelConfirmar = 'Excluir',
  onConfirmar,
  onCancelar,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{titulo}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{descricao}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-sm transition-colors"
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
