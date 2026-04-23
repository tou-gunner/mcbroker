'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Variant = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

export interface PromptOptions {
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'number';
  confirmLabel?: string;
  cancelLabel?: string;
  validate?: (value: string) => string | null;
}

type ConfirmState = {
  kind: 'confirm';
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
};

type PromptState = {
  kind: 'prompt';
  options: PromptOptions;
  resolve: (value: string | null) => void;
};

type DialogState = ConfirmState | PromptState | null;

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useConfirm must be used inside <DialogProvider>');
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('usePrompt must be used inside <DialogProvider>');
  return ctx.prompt;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setState(null);
    setPromptValue('');
    setPromptError(null);
    previouslyFocused.current?.focus();
    previouslyFocused.current = null;
  }, []);

  const confirm = useCallback<DialogContextValue['confirm']>(
    (options) =>
      new Promise<boolean>((resolve) => {
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        setState({ kind: 'confirm', options, resolve });
      }),
    [],
  );

  const prompt = useCallback<DialogContextValue['prompt']>(
    (options) =>
      new Promise<string | null>((resolve) => {
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        setPromptValue(options.defaultValue ?? '');
        setPromptError(null);
        setState({ kind: 'prompt', options, resolve });
      }),
    [],
  );

  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => {
      if (state.kind === 'prompt') {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        cancelRef.current?.focus();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const cancel = () => {
    if (!state) return;
    if (state.kind === 'confirm') state.resolve(false);
    else state.resolve(null);
    close();
  };

  const confirmAction = () => {
    if (!state) return;
    if (state.kind === 'confirm') {
      state.resolve(true);
      close();
      return;
    }
    const { validate } = state.options;
    const err = validate ? validate(promptValue) : null;
    if (err) {
      setPromptError(err);
      return;
    }
    state.resolve(promptValue);
    close();
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={cancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div
            className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                {state.options.title}
              </h2>
              {state.options.description && (
                <p className="mt-2 text-sm text-gray-600">
                  {state.options.description}
                </p>
              )}

              {state.kind === 'prompt' && (
                <div className="mt-4 space-y-1">
                  {state.options.label && (
                    <label className="block text-xs font-medium text-gray-700">
                      {state.options.label}
                    </label>
                  )}
                  <input
                    ref={inputRef}
                    type={state.options.inputType ?? 'text'}
                    value={promptValue}
                    placeholder={state.options.placeholder}
                    onChange={(e) => {
                      setPromptValue(e.target.value);
                      if (promptError) setPromptError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmAction();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {promptError && (
                    <p className="text-xs text-red-600 mt-1">{promptError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={cancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {state.options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  state.kind === 'confirm' && state.options.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {state.options.confirmLabel ??
                  (state.kind === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
