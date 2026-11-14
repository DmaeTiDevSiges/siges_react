// Transformador do Jest: ts-jest + tradução de `import.meta` (Vite/ESM) para CommonJS.
// `import.meta.env.X` passa a ler `process.env.X`; `import.meta.hot` fica undefined.
const { TsJestTransformer } = require('ts-jest');

const META = '({ env: process.env, hot: undefined, url: "file:///jest" })';

class Transformer extends TsJestTransformer {
    process(src, filePath, options) {
        return super.process(src.replace(/import\.meta/g, META), filePath, options);
    }
    async processAsync(src, filePath, options) {
        return super.processAsync(src.replace(/import\.meta/g, META), filePath, options);
    }
    getCacheKey(src, filePath, options) {
        return super.getCacheKey(src.replace(/import\.meta/g, META), filePath, options);
    }
}

module.exports = {
    createTransformer(tsJestConfig) {
        return new Transformer(tsJestConfig);
    },
};
