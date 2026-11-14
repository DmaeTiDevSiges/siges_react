import * as fs from 'fs';
import * as path from 'path';
import { findUnnamedIconButtons } from './findUnnamedIconButtons';

const ROOT = path.resolve(__dirname, '../..');
const SKIP = new Set(['node_modules', 'dist', 'dist-electron', 'android', 'ios', '.git', 'tests', 'coverage', 'storage', 'workers']);

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(path.join(dir, entry.name));
        return entry.name.endsWith('.tsx') && !entry.name.includes('.test.') ? [path.join(dir, entry.name)] : [];
    });

describe('detector de botão só de ícone sem nome', () => {
    it('acha o botão sem nome', () => {
        const src = `<div>\n<button onClick={x} className="a">\n<span className="material-symbols-outlined">close</span>\n</button></div>`;
        expect(findUnnamedIconButtons(src)).toEqual([expect.objectContaining({ line: 2 })]);
    });

    it('aceita aria-label, aria-labelledby e title', () => {
        for (const attr of ['aria-label="Fechar"', 'aria-labelledby="t"', 'title="Fechar"', 'aria-label={open ? "a" : "b"}']) {
            expect(findUnnamedIconButtons(`<button ${attr}><span className="material-symbols-outlined">close</span></button>`)).toEqual([]);
        }
    });

    it('botão com texto ou expressão além do ícone não conta', () => {
        expect(findUnnamedIconButtons(`<button><span className="material-symbols-outlined">add</span> Novo</button>`)).toEqual([]);
        expect(findUnnamedIconButtons(`<button><span className="material-symbols-outlined">add</span>{label}</button>`)).toEqual([]);
    });

    it('ícone com nome do glifo em expressão também é detectado', () => {
        expect(findUnnamedIconButtons(`<button onClick={() => { a(); }}><span className="material-symbols-outlined">{open ? 'a' : 'b'}</span></button>`)).toHaveLength(1);
    });

    it('botão sem ícone material-symbols é ignorado', () => {
        expect(findUnnamedIconButtons(`<button>OK</button>`)).toEqual([]);
    });
});

describe('código do app', () => {
    it('nenhum <button> só de ícone sem nome acessível', () => {
        const offenders = walk(ROOT).flatMap(file =>
            findUnnamedIconButtons(fs.readFileSync(file, 'utf8')).map(b => `${path.relative(ROOT, file)}:${b.line}  ${b.snippet}`));
        expect(offenders).toEqual([]);
    });
});
