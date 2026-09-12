/**
 * Parser simples de expressões matemáticas (sem eval/new Function).
 * Suporta: números, operadores + - * /, parênteses.
 */

function tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < expr.length) {
        const ch = expr[i];
        if (ch === ' ') { i++; continue; }
        if ('+-*/()'.includes(ch)) {
            tokens.push(ch);
            i++;
        } else if (/[0-9.]/.test(ch)) {
            let num = '';
            while (i < expr.length && /[0-9.]/.test(expr[i])) {
                num += expr[i];
                i++;
            }
            tokens.push(num);
        } else {
            return [];
        }
    }
    return tokens;
}

function parseExpr(tokens: string[], pos: { i: number }): number {
    let left = parseTerm(tokens, pos);
    while (pos.i < tokens.length && (tokens[pos.i] === '+' || tokens[pos.i] === '-')) {
        const op = tokens[pos.i++];
        const right = parseTerm(tokens, pos);
        left = op === '+' ? left + right : left - right;
    }
    return left;
}

function parseTerm(tokens: string[], pos: { i: number }): number {
    let left = parseFactor(tokens, pos);
    while (pos.i < tokens.length && (tokens[pos.i] === '*' || tokens[pos.i] === '/')) {
        const op = tokens[pos.i++];
        const right = parseFactor(tokens, pos);
        left = op === '*' ? left * right : left / right;
    }
    return left;
}

function parseFactor(tokens: string[], pos: { i: number }): number {
    if (pos.i >= tokens.length) return 0;

    if (tokens[pos.i] === '(') {
        pos.i++; // skip (
        const val = parseExpr(tokens, pos);
        if (pos.i < tokens.length && tokens[pos.i] === ')') pos.i++; // skip )
        return val;
    }

    if (tokens[pos.i] === '-') {
        pos.i++;
        return -parseFactor(tokens, pos);
    }

    if (tokens[pos.i] === '+') {
        pos.i++;
        return parseFactor(tokens, pos);
    }

    const num = parseFloat(tokens[pos.i]);
    pos.i++;
    return num;
}

export function evaluateExpression(expr: string): number | null {
    if (!expr || !expr.trim()) return null;

    let normalized = expr.replace(/,/g, '.').replace(/\s+/g, '');
    const tokens = tokenize(normalized);
    if (tokens.length === 0) return null;

    try {
        const pos = { i: 0 };
        const result = parseExpr(tokens, pos);
        if (!isFinite(result)) return null;
        return Math.round(result * 10000) / 10000;
    } catch {
        return null;
    }
}

export function formatCalcNumber(val: number): string {
    return val.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}
