// ESLint (flat config) — foco em bugs reais de React: regras de hooks.
// Tudo entra como "warn" para não travar o que já existe; o objetivo é o número
// de avisos só cair. Regras de estilo ficam com o TypeScript/Prettier, não aqui.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    {
        ignores: [
            'dist/**', 'dist-electron/**', 'android/**', 'ios/**', 'node_modules/**', 'dev/**',
            'workers/**', 'workflows/**', 'scripts/**', 'docs/**', 'public/**', 'electron/**', 'storage/**', 'patches/**',
            '**/*.test.ts', '**/*.test.tsx', 'tests/**',
            '*.config.js', '*.config.cjs', '*.config.ts',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            // O projeto usa `any` em muitos pontos (sugestão 4 reduz aos poucos): só aviso.
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-case-declarations': 'off',
            'no-useless-escape': 'off',
            'prefer-const': 'warn',
        },
    },
    // dataService é fachada: `servico.metodo.apply(servico, arguments)` é o padrão (AGENTS.md).
    {
        files: ['services/dataService.ts'],
        rules: { 'prefer-spread': 'off', 'prefer-rest-params': 'off' },
    },
    // r2Service tem uma função chamada useWorker() que NÃO é hook do React.
    {
        files: ['services/media/r2Service.ts'],
        rules: { 'react-hooks/rules-of-hooks': 'off' },
    },
    // Regras novas do ESLint 10 que o código antigo ainda viola: só aviso.
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            'no-useless-assignment': 'warn',
            'preserve-caught-error': 'warn',
            // Casos pontuais de código antigo (App.tsx, flowConverter...): corrigir aos poucos.
            'no-async-promise-executor': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            'no-useless-catch': 'warn',
            'no-prototype-builtins': 'warn',
            '@typescript-eslint/no-require-imports': 'warn',
            'no-constant-condition': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
        },
    },
);
