import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { registerBackHandler, runBackHandlers } from '../utils/backButton';

/**
 * Ponte tela ⇄ URL (etapa 1 do PLANO_MELHORIAS_FRONTEND.md).
 *
 * O `currentScreen` do App continua sendo a fonte de verdade; aqui cada troca
 * de tela (ou de ids selecionados) vira uma entrada no histórico:
 *   - 1a: `#/<tela>`; voltar/avançar do navegador funcionam; voltar para a tela
 *     que era a anterior desempilha a entrada; voltar para tela que exige uma
 *     seleção perdida (`canEnter`) cai em `homeScreen`.
 *   - 1b: telas com rota própria (app/screenRoutes.ts, ex.: `#/visit/12`)
 *     levam os ids na entrada do histórico. Ao voltar/avançar ou recarregar, a
 *     seleção é lida DA ENTRADA (`applySelection`) e `canEnter` não se aplica.
 *     Fora do localhost os ids não aparecem na barra (`toUrl` → `#/visit`): vão
 *     no `history.state`, e `fromLocation` os lê de lá. Por isso a identidade da
 *     entrada é a chave `toPath` (sempre com ids), não a URL exibida.
 * Botão voltar do Android (antes fechava o app em qualquer tela), em ordem:
 *   1. tratadores "por cima" (utils/backButton: modal, painel, passo de fluxo);
 *   2. `logicalBack` — o mesmo voltar da seta do cabeçalho (handleBack do App);
 *   3. histórico (-1); 4. tela inicial; 5. sair do app (já na tela inicial).
 *
 * Só age com `enabled` (usuário logado): antes disso o `#` pode trazer o token
 * de recuperação de senha do Supabase e não pode ser sobrescrito.
 */

type Selection = Record<string, string | null | undefined>;

interface Routing<S extends string> {
    /** Chave da entrada (sempre com ids): decide se é entrada nova. */
    toPath: (screen: S, selection: Selection) => string;
    /** O que vai na barra. Padrão: toPath. */
    toUrl?: (screen: S, selection: Selection) => string;
    /** Tela e ids da entrada atual (caminho e/ou history.state); null = não é rota com ids. */
    fromLocation: (pathname: string, state: unknown) => { screen: S; selection: Selection } | null;
}

interface Options<S extends string> {
    screen: S;
    setScreen: (screen: S) => void;
    enabled: boolean;
    /** Tela raiz: destino de fallback e onde o voltar do Android sai do app. */
    homeScreen: S;
    /** false = esta tela (sem rota própria) não abre sem uma seleção que se perdeu. */
    canEnter?: (screen: S) => boolean;
    /** Voltar "de verdade" da tela atual (seta do cabeçalho). true = tratou. */
    logicalBack?: () => boolean;
    /** Ids selecionados agora (os da rota da tela atual entram no caminho). */
    selection?: Selection;
    /** Aplica os ids lidos da URL (voltar/avançar, recarregar, link). */
    applySelection?: (selection: Selection) => void;
    routing?: Routing<S>;
}

interface EntryState { screen?: string; selection?: Selection }

const legacyRouting: Routing<string> = { toPath: screen => `/${screen}`, fromLocation: () => null };
const EMPTY: Selection = {};

/** Posição da entrada atual no histórico (o react-router grava `idx` no history.state). */
const historyIdx = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0;

export const useScreenHistory = <S extends string>({
    screen, setScreen, enabled, homeScreen, canEnter, logicalBack,
    selection = EMPTY, applySelection, routing = legacyRouting as Routing<S>,
}: Options<S>): void => {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();
    const path = routing.toPath(screen, selection);
    const urlOf = (r: Routing<S>, s: S, sel: Selection) => (r.toUrl ?? r.toPath)(s, sel);
    const url = urlOf(routing, screen, selection);

    // Caminho que acabou de vir de um POP/adoção da URL: não vira nova entrada.
    const fromUrl = useRef<string | null>(null);
    // O próprio hook chamou navigate(-1): o POP resultante já está tratado.
    const selfPop = useRef(false);
    const synced = useRef(false);
    // Caminhos por posição do histórico (só nesta sessão; após recarregar, vazio).
    const stack = useRef<string[]>([]);

    const latest = useRef({ screen, path, url, selection, setScreen, homeScreen, canEnter, logicalBack, applySelection, routing, navigate });
    latest.current = { screen, path, url, selection, setScreen, homeScreen, canEnter, logicalBack, applySelection, routing, navigate };

    /** Leva o app para a tela/ids de uma rota vinda da URL. */
    const adopt = (target: { screen: S; selection: Selection }) => {
        const { path: current, routing: r, setScreen: set, applySelection: apply } = latest.current;
        const targetPath = r.toPath(target.screen, target.selection);
        if (targetPath !== current) fromUrl.current = targetPath;
        apply?.(target.selection);
        set(target.screen);
    };

    // Tela/ids → URL
    useEffect(() => {
        if (!enabled) return;
        if (fromUrl.current === path) { fromUrl.current = null; return; }
        const state: EntryState = { screen, selection };
        if (!synced.current) {
            synced.current = true;
            // Recarregou ou abriu um link com rota migrada: segue a entrada, não a tela inicial.
            const linked = routing.fromLocation(location.pathname, location.state);
            if (linked && routing.toPath(linked.screen, linked.selection) !== path) {
                stack.current = [];
                stack.current[historyIdx()] = routing.toPath(linked.screen, linked.selection);
                adopt(linked);
                navigate(urlOf(routing, linked.screen, linked.selection), {
                    replace: true, state: { screen: linked.screen, selection: linked.selection },
                });
                return;
            }
            stack.current = [];
            stack.current[historyIdx()] = path;
            navigate(url, { replace: true, state });
            return;
        }
        // Já está nesta entrada (compara a chave: no modo oculto a URL se repete entre ids).
        if (stack.current[historyIdx()] === path) return;
        const idx = historyIdx();
        if (idx > 0 && stack.current[idx - 1] === path) {
            // Voltou para a entrada anterior: desempilha.
            selfPop.current = true;
            navigate(-1);
            return;
        }
        stack.current = stack.current.slice(0, idx + 1);
        stack.current[idx + 1] = path;
        navigate(url, { state });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, enabled]);

    // URL → tela (só voltar/avançar)
    useEffect(() => {
        // 'default' = entrada inicial (ainda sem nossa marca); o efeito acima a sincroniza.
        if (!enabled || navigationType !== 'POP' || !synced.current || location.key === 'default') return;
        if (selfPop.current) { selfPop.current = false; return; }
        const { screen: current, path: currentPath, url: currentUrl, selection: currentSel, setScreen: set, homeScreen: home, canEnter: allowed, navigate: go, routing: r } = latest.current;

        const linked = r.fromLocation(location.pathname, location.state);
        if (linked) {
            // Rota com parâmetros: os ids vêm da própria entrada.
            stack.current[historyIdx()] = r.toPath(linked.screen, linked.selection);
            if (r.toPath(linked.screen, linked.selection) !== currentPath) adopt(linked);
            return;
        }

        const target = (location.state as EntryState | null)?.screen as S | undefined;
        if (!target) {
            // Entrada que não é nossa (ex.: URL digitada): volta a refletir a tela atual.
            stack.current[historyIdx()] = currentPath;
            go(currentUrl, { replace: true, state: { screen: current, selection: currentSel } });
            return;
        }
        if (target === current && r.toPath(target, EMPTY) === currentPath) return;
        if (allowed && !allowed(target)) {
            if (home !== current) { fromUrl.current = r.toPath(home, EMPTY); set(home); }
            stack.current[historyIdx()] = r.toPath(home, EMPTY);
            go(urlOf(r, home, EMPTY), { replace: true, state: { screen: home } });
            return;
        }
        stack.current[historyIdx()] = r.toPath(target, EMPTY);
        fromUrl.current = r.toPath(target, EMPTY);
        set(target);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    // Botão voltar do Android
    useEffect(() => {
        if (!enabled || !Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        const unregister = registerBackHandler(() => {
            const { screen: current, setScreen: set, homeScreen: home, navigate: go, logicalBack: back } = latest.current;
            if (back?.()) return true;
            if (historyIdx() > 0) { go(-1); return true; }
            if (current !== home) { set(home); return true; }
            return false;
        });
        CapApp.addListener('backButton', () => {
            if (!runBackHandlers()) CapApp.exitApp().catch(() => undefined);
        }).then(h => { remove = () => h.remove(); }).catch(() => undefined);
        return () => { unregister(); remove?.(); };
    }, [enabled]);
};
