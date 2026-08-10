import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="fixed inset-0 z-[99999] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                        Algo deu errado
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
                        Ocorreu um erro inesperado. Tente novamente ou recarregue o aplicativo.
                    </p>
                    {this.state.error && (
                        <details className="w-full max-w-md mb-6 text-left">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest">
                                Detalhes do erro
                            </summary>
                            <pre className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40 font-mono">
                                {this.state.error.message}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRetry}
                            className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Recarregar App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
