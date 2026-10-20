import React, { useEffect, useState } from 'react';
import { fromDateTimeLocalValue, shiftCrossesMidnight } from '../../utils/appNoticePeriod';

interface ShiftCreatorProps {
  /**
   * Chamado com os timestamps naive (`YYYY-MM-DDTHH:mm:00`) de início e fim.
   * O fim é sempre posterior ao início (pode ser no dia seguinte).
   * Devolver `false` mantém o formulário aberto (ex.: erro de validação).
   */
  onCreate: (startNaive: string, endNaive: string) => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
  /** Início sugerido no formato `YYYY-MM-DDTHH:mm` (datetime-local). */
  defaultStart?: string;
  /** Fim sugerido no formato `YYYY-MM-DDTHH:mm` (datetime-local). */
  defaultEnd?: string;
  /**
   * Estado do formulário controlado pelo pai, para que o gatilho (botão
   * "Nova escala") possa ficar no cabeçalho da seção e o formulário aberto
   * ocupe a largura inteira logo abaixo.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Renderiza APENAS o botão "Nova escala" (sem o formulário). O pai coloca o
   * botão no cabeçalho da seção e o formulário — com `open` controlado — logo
   * abaixo, ocupando a largura cheia.
   */
  triggerOnly?: boolean;
}

const isValidLocal = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);

/**
 * Formulário de criação de uma ESCALA.
 *
 * Usa data E hora completas porque uma escala pode começar num dia e terminar
 * no seguinte, e a primeira escala de um aviso costuma cobrir a janela de
 * visualização inteira — que pode durar vários dias.
 *
 * Os defaults vêm do chamador (`suggestNextShiftRange`); o usuário ajusta.
 */
export const ShiftCreator: React.FC<ShiftCreatorProps> = ({
  onCreate,
  disabled = false,
  defaultStart = '',
  defaultEnd = '',
  open: openProp,
  onOpenChange,
  triggerOnly = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  // Ao mudar a sugestão (troca de dia/escala) e com o formulário fechado,
  // ressincroniza os campos.
  useEffect(() => {
    if (!open) {
      setStart(defaultStart);
      setEnd(defaultEnd);
    }
  }, [defaultStart, defaultEnd, open]);

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[14px]">add</span>
      Nova escala
    </button>
  );

  if (triggerOnly) return trigger;

  // Formulário fechado: o próprio componente mostra o gatilho, exceto quando o
  // pai já o exibe no cabeçalho (open controlado) — aí não duplica.
  if (!open) {
    return isControlled ? null : trigger;
  }

  const startNaive = fromDateTimeLocalValue(start);
  const endNaive = fromDateTimeLocalValue(end);
  const missing = !startNaive || !endNaive;
  // Comparação por instante: aceita virada de dia, rejeita fim <= início
  const invalidRange = !missing && endNaive <= startNaive;
  const invalid = missing || invalidRange;
  const crossesMidnight = !invalid && shiftCrossesMidnight(startNaive, endNaive);

  const fieldClass =
    'w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:border-transparent';

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-tight text-primary">
        Nova escala
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Início
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={disabled}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Fim
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={disabled}
            className={fieldClass}
          />
        </div>
      </div>

      {crossesMidnight && (
        <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
          Termina no dia seguinte.
        </p>
      )}

      {invalidRange && (
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
          O fim deve ser posterior ao início.
        </p>
      )}
      {missing && !invalidRange && (
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
          Informe início e fim da escala.
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || invalid}
          onClick={async () => {
            const result = await onCreate(startNaive, endNaive);
            // Só fecha quando a criação deu certo; erro mantém o formulário
            // aberto para o usuário corrigir os horários.
            if (result !== false) setOpen(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">check</span>
          Criar escala
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={disabled}
          className="rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {isValidLocal(start) && isValidLocal(end) && (
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          O fim pode ser em outro dia — a escala é contínua até esse instante.
        </p>
      )}
    </div>
  );
};
