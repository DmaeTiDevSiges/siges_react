import * as fs from 'fs';
import * as path from 'path';
import { findUnnamedFormControls } from './findUnnamedFormControls';

const ROOT = path.resolve(__dirname, '../..');
const SKIP = new Set(['node_modules', 'dist', 'dist-electron', 'android', 'ios', '.git', 'tests', 'coverage', 'storage', 'workers']);

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(path.join(dir, entry.name));
        return entry.name.endsWith('.tsx') && !entry.name.includes('.test.') ? [path.join(dir, entry.name)] : [];
    });

describe('detector de campo de formulário sem nome', () => {
    it('acha o campo sem nome (mesmo com placeholder)', () => {
        expect(findUnnamedFormControls(`<div>\n<input type="text" placeholder="Buscar" />\n</div>`)).toEqual([expect.objectContaining({ line: 2 })]);
        expect(findUnnamedFormControls(`<select value={a}><option>x</option></select>`)).toHaveLength(1);
        expect(findUnnamedFormControls(`<textarea value={a} />`)).toHaveLength(1);
    });

    it('aceita aria-label, aria-labelledby e title', () => {
        for (const attr of ['aria-label="Nome"', 'aria-labelledby="t"', 'title="Nome"', 'aria-label={`Buscar ${x}`}']) {
            expect(findUnnamedFormControls(`<input ${attr} />`)).toEqual([]);
        }
    });

    it('aceita id ligado por <label htmlFor> e campo dentro de <label>', () => {
        expect(findUnnamedFormControls(`<label htmlFor="cpf">CPF</label><input id="cpf" />`)).toEqual([]);
        expect(findUnnamedFormControls(`<label>CPF <input /></label>`)).toEqual([]);
        expect(findUnnamedFormControls(`<label htmlFor={id}>CPF</label><input id={id} />`)).toEqual([]);
    });

    it('um <label> que já fechou não cobre o campo seguinte', () => {
        expect(findUnnamedFormControls(`<label>CPF</label><input />`)).toHaveLength(1);
    });

    it('ignora hidden, campo escondido por className e exemplos em comentário', () => {
        expect(findUnnamedFormControls(`<input type="hidden" value="1" />`)).toEqual([]);
        expect(findUnnamedFormControls(`<input type="file" className="hidden" />`)).toEqual([]);
        expect(findUnnamedFormControls(`/**\n * <input name="a" />\n */`)).toEqual([]);
    });

    it('id sem <label htmlFor> correspondente continua sem nome', () => {
        expect(findUnnamedFormControls(`<input id="x" />`)).toHaveLength(1);
    });
});

describe('código do app', () => {
    it('nenhum <input>/<select>/<textarea> solto sem nome acessível', () => {
        const offenders = walk(ROOT).flatMap(file =>
            findUnnamedFormControls(fs.readFileSync(file, 'utf8')).map(b => `${path.relative(ROOT, file)}:${b.line}  ${b.snippet}`));
        expect(offenders).toEqual([]);
    });
});
