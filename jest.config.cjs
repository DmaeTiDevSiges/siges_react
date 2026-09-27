module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    // Permite imports com o alias do Vite/tsconfig (@/services/..., etc.)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
};
