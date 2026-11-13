import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SectionCard } from '../../components/ui/SectionCard';
import { ListRow } from '../../components/ui/ListRow';
import { ShortcutRail } from '../../components/ui/ShortcutRail';
import { HiddenValue } from '../../components/ui/HiddenValue';
import { StepFlow } from '../../components/ui/StepFlow';
import { useUiVersion } from '../../contexts/UiVersionContext';

/**
 * Vitrine do kit de componentes (docs/PLANO_DESIGN_ESTILO_NUBANK.md, F1).
 * Abre por cima do Perfil quando VITE_FEATURE_UI_V2=true. Para revisar os 4 modos:
 * v1/v2 (chave no topo) × claro/escuro (tema do app).
 */

const SWATCHES = ['brand', 'brand-soft', 'bg', 'surface', 'surface-2', 'line', 'fg', 'fg-muted', 'fg-subtle', 'success', 'warning', 'danger'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-8">
        <h2 className="px-4 mb-3 text-headline text-fg">{title}</h2>
        {children}
    </section>
);

export const DesignKitScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { isV2, setUiVersion, toggleHideValues, hideValues } = useUiVersion();
    const [showFlow, setShowFlow] = useState(false);
    const [unit, setUnit] = useState('');
    const [problem, setProblem] = useState('');

    // Botão voltar do Android fecha a vitrine (o StepFlow trata o próprio voltar).
    useEffect(() => {
        if (showFlow || !Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        CapApp.addListener('backButton', onClose)
            .then(h => { remove = () => h.remove(); })
            .catch(() => undefined);
        return () => remove?.();
    }, [showFlow, onClose]);

    const shortcuts = [
        { id: 'a', icon: 'add_circle', label: 'Nova SS', onClick: () => {} },
        { id: 'b', icon: 'qr_code_scanner', label: 'Escanear ativo', onClick: () => {} },
        { id: 'c', icon: 'event_available', label: 'Hoje', onClick: () => {}, badge: 3 },
        { id: 'd', icon: 'trolley', label: 'Materiais', onClick: () => {} },
        { id: 'e', icon: 'menu_book', label: 'Manuais', onClick: () => {} },
        { id: 'f', icon: 'handyman', label: 'Ferramentas', onClick: () => {} },
    ];

    return (
        <div className="fixed inset-0 z-[60] bg-bg flex flex-col screen-safe">
            {showFlow ? (
                <StepFlow
                    steps={[
                        {
                            key: 'unit',
                            title: 'Em qual unidade?',
                            description: 'Digite o nome ou o código da unidade.',
                            content: <Input variant="underline" placeholder="Ex.: Escola Central" value={unit} onChange={e => setUnit(e.target.value)} autoFocus />,
                            canAdvance: unit.trim().length > 0,
                        },
                        {
                            key: 'problem',
                            title: 'O que está acontecendo?',
                            content: <Input variant="underline" placeholder="Descreva em poucas palavras" value={problem} onChange={e => setProblem(e.target.value)} autoFocus />,
                            canAdvance: problem.trim().length > 3,
                        },
                        {
                            key: 'confirm',
                            title: 'Confira e envie',
                            content: (
                                <div className="rounded-card bg-surface-2 divide-y divide-line">
                                    <ListRow icon="apartment" title={unit} subtitle="Unidade" />
                                    <ListRow icon="report" title={problem} subtitle="Problema" />
                                </div>
                            ),
                        },
                    ]}
                    finishLabel="Enviar"
                    onCancel={() => setShowFlow(false)}
                    onFinish={() => { setShowFlow(false); setUnit(''); setProblem(''); }}
                />
            ) : (
                <>
                    <header className="shrink-0 flex items-center gap-2 px-2 py-2 bg-surface">
                        <button type="button" onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full text-fg cursor-pointer hover:bg-surface-2" aria-label="Fechar">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h1 className="flex-1 text-headline text-fg">Kit de componentes</h1>
                        <button
                            type="button"
                            onClick={() => setUiVersion(isV2 ? 'v1' : 'v2')}
                            className="h-9 px-3 rounded-full bg-surface-2 text-label text-fg cursor-pointer"
                        >
                            {isV2 ? 'v2 (novo)' : 'v1 (atual)'}
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                        <Section title="Cores">
                            <div className="grid grid-cols-4 gap-3 px-4">
                                {SWATCHES.map(t => (
                                    <div key={t} className="flex flex-col items-center gap-1">
                                        <span className="w-12 h-12 rounded-full border border-line" style={{ background: `var(--color-${t})` }} />
                                        <span className="text-caption text-fg-muted text-center">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="Tipografia">
                            <div className="px-4 space-y-1">
                                <p className="text-display text-fg">Display 28</p>
                                <p className="text-title text-fg">Title 22</p>
                                <p className="text-headline text-fg">Headline 18</p>
                                <p className="text-body text-fg">Body 16 — texto corrido</p>
                                <p className="text-label text-fg-muted">Label 14 — rótulos</p>
                                <p className="text-caption text-fg-muted">Caption 12 — legendas</p>
                            </div>
                        </Section>

                        <Section title="Atalhos">
                            <ShortcutRail items={shortcuts} />
                        </Section>

                        <Section title="Cards de seção">
                            <div className="px-4 flex flex-col gap-3">
                                <SectionCard highlight icon="play_circle" title="Visita em andamento" value="OV-2026-0142" action={{ label: 'Retomar visita', onClick: () => {} }} onClick={() => {}} />
                                <SectionCard icon="event_available" title="Hoje" value="3 OS programadas" description="Próxima: OS-2026-0981 · Escola Central" onClick={() => {}} />
                                <SectionCard
                                    icon="local_gas_station"
                                    title="Abastecimentos no mês"
                                    value={<HiddenValue>R$ 1.284,90</HiddenValue>}
                                    description={<button type="button" onClick={(e) => { e.stopPropagation(); toggleHideValues(); }} className="text-brand cursor-pointer">{hideValues ? 'Mostrar valor' : 'Ocultar valor'}</button>}
                                />
                            </div>
                        </Section>

                        <Section title="Lista">
                            <div className="mx-4 rounded-card bg-surface divide-y divide-line overflow-hidden">
                                <ListRow icon="apartment" title="Escola Central" subtitle="Rua das Flores, 120" onClick={() => {}} />
                                <ListRow icon="inventory_2" title="Ar-condicionado 18.000 BTU" subtitle="TAG AC-0042" trailing="Ativo" onClick={() => {}} />
                                <ListRow icon="warning" iconClassName="bg-warning-soft text-warning" title="Ativo com alerta" subtitle="Manutenção vencida" onClick={() => {}} />
                            </div>
                        </Section>

                        <Section title="Botões">
                            <div className="px-4 flex flex-col gap-3">
                                <Button fullWidth onClick={() => setShowFlow(true)}>Abrir fluxo guiado (StepFlow)</Button>
                                <Button fullWidth variant="secondary">Secundário</Button>
                                <div className="flex gap-3">
                                    <Button variant="ghost">Ghost</Button>
                                    <Button size="sm">Pequeno</Button>
                                </div>
                            </div>
                        </Section>

                        <Section title="Campos">
                            <div className="px-4 flex flex-col gap-6">
                                <Input label="Campo padrão" placeholder="Digite…" />
                                <Input variant="underline" label="Campo sublinhado (fluxos)" placeholder="R$ 0,00" />
                            </div>
                        </Section>

                        <Section title="Card genérico">
                            <div className="px-4">
                                <Card>
                                    <p className="text-body text-fg">Card plano no v2; com borda e sombra no v1.</p>
                                </Card>
                            </div>
                        </Section>
                    </div>
                </>
            )}
        </div>
    );
};
