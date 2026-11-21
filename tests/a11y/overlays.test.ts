import * as fs from 'fs';
import * as path from 'path';
import { findTags, lineOf } from './jsxScan';

const ROOT = path.resolve(__dirname, '../..');
const SKIP = new Set(['node_modules', 'dist', 'dist-electron', 'android', 'ios', '.git', 'tests', 'coverage', 'storage', 'workers', '.claude']);
/** Telas de carregamento/erro: cobrem a tela, mas não são diálogos (não há o que focar nem fechar). */
const NOT_DIALOGS = new Set(['components/ui/Loading.tsx', 'components/ui/ErrorBoundary.tsx']);

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(path.join(dir, entry.name));
        return entry.name.endsWith('.tsx') && !entry.name.includes('.test.') ? [path.join(dir, entry.name)] : [];
    });

/**
 * Uma camada que cobre a tela com fundo escuro (`fixed inset-0` + `bg-black…`/`backdrop-blur`)
 * é um diálogo: precisa de `role="dialog"` (e de Esc/foco). Use `Modal`, `BottomSheet` ou, para um
 * diálogo feito à mão, `DialogShell` (que já traz tudo); não escreva a `<div>` solta.
 */
export const findUnroledDimOverlays = (source: string): number[] =>
    findTags(source, ['div'])
        // o fundo escuro AUTOCONTIDO (`<div … />`) é só a cortina decorativa de dentro de um diálogo
        .filter(t => !t.selfClosing && /fixed inset-0/.test(t.attrs) && /bg-(black|slate-9\d\d|gray-9\d\d)|backdrop-blur/.test(t.attrs) && !/\brole=/.test(t.attrs))
        .map(t => lineOf(source, t.start));

describe('detector de diálogo feito à mão sem papel', () => {
    it('acha a camada escura sem role', () => {
        expect(findUnroledDimOverlays(`<div className="fixed inset-0 z-50 bg-black/60">x</div>`)).toEqual([1]);
        expect(findUnroledDimOverlays(`<div className="fixed inset-0 backdrop-blur-sm" onClick={() => a > b}>x</div>`)).toEqual([1]);
    });

    it('aceita com role, e ignora camadas de clique-fora sem fundo escuro', () => {
        expect(findUnroledDimOverlays(`<div role="dialog" className="fixed inset-0 bg-black/60">x</div>`)).toEqual([]);
        expect(findUnroledDimOverlays(`<div className="fixed inset-0 z-40" onClick={close} />`)).toEqual([]);
    });

    it('a cortina decorativa autocontida (<div … />) não conta', () => {
        expect(findUnroledDimOverlays(`<div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" />`)).toEqual([]);
    });

    it('DialogShell não conta (é o jeito certo)', () => {
        expect(findUnroledDimOverlays(`<DialogShell label="A" onClose={f} className="fixed inset-0 bg-black/60">x</DialogShell>`)).toEqual([]);
    });
});

describe('código do app', () => {
    it('nenhum diálogo de fundo escuro feito à mão sem role', () => {
        const offenders = walk(ROOT)
            .filter(f => !NOT_DIALOGS.has(path.relative(ROOT, f).split(path.sep).join('/')))
            .flatMap(f => findUnroledDimOverlays(fs.readFileSync(f, 'utf8')).map(line => `${path.relative(ROOT, f)}:${line}`));
        expect(offenders).toEqual([]);
    });
});
