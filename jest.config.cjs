// Opções do ts-jest nos testes de UI: esModuleInterop porque libs ESM (react-router) fazem `import React from 'react'`.
const tsUi = { target: 'ES2022', module: 'commonjs', jsx: 'react-jsx', allowJs: true, esModuleInterop: true, isolatedModules: true, skipLibCheck: true };
const alias = { '^@/(.*)$': '<rootDir>/$1' };

module.exports = {
    projects: [
        // Serviços / lógica pura (como antes)
        {
            displayName: 'node',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['**/*.test.ts'],
            moduleNameMapper: alias,
            globals: { 'ts-jest': { tsconfig: 'tsconfig.json' } },
        },
        // Telas e componentes (React Testing Library)
        {
            displayName: 'ui',
            preset: 'ts-jest',
            testEnvironment: 'jsdom',
            testMatch: ['**/*.test.tsx'],
            // Teste legado que nunca rodou (mocks quebrados); fora até ser reescrito.
            testPathIgnorePatterns: ['/node_modules/', 'DataQualityIndicator.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/tests/setupUi.ts'],
            moduleNameMapper: {
                ...alias,
                // features.ts usa import.meta.env (Vite): nos testes entra o stub.
                '^(\\.{1,2}/)+features$': '<rootDir>/tests/featuresStub.ts',
                '\\.(css|svg|png|jpg|webp)$': '<rootDir>/tests/fileMock.cjs',
            },
            // react-router é só ESM e usa import.meta: transformador próprio (ts-jest + import.meta).
            transform: { '^.+\\.(m?[jt]s|[jt]sx)$': ['<rootDir>/tests/tsJestImportMeta.cjs', { tsconfig: tsUi, diagnostics: false }] },
            transformIgnorePatterns: ['/node_modules/(?!(react-router|@remix-run|cookie-es|cookie|set-cookie-parser|turbo-stream)/)'],
        },
    ],
};
