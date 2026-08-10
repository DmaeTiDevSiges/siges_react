import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const dataServicePath = path.join(root, 'services', 'dataService.ts');

// Ordered from broad/legacy domains to the most specific domain. Later entries
// intentionally win when two extracted services expose the same method.
const serviceFiles = [
  ['ordersService', 'services/orders/ordersService.ts'],
  ['visitsService', 'services/orders/visitsService.ts'],
  ['companiesService', 'services/companies/companiesService.ts'],
  ['visitChatService', 'services/orders/visitChatService.ts'],
  ['maintenancePlansService', 'services/core/maintenancePlansService.ts'],
  ['materialsService', 'services/materials/materialsService.ts'],
  ['purchasesService', 'services/materials/purchasesService.ts'],
  ['warehouseService', 'services/materials/warehouseService.ts'],
  ['assetsService', 'services/assets/assetsService.ts'],
  ['assetTagsService', 'services/assets/assetTagsService.ts'],
  ['assetConfigService', 'services/assets/assetConfigService.ts'],
  ['assetAttributesService', 'services/assets/assetAttributesService.ts'],
  ['unitsService', 'services/core/unitsService.ts'],
  ['usersService', 'services/users/usersService.ts'],
  ['notificationsService', 'services/core/notificationsService.ts'],
  ['settingsService', 'services/core/settingsService.ts'],
  ['dashboardService', 'services/core/dashboardService.ts'],
  ['orderConfigService', 'services/core/orderConfigService.ts'],
  ['toolsService', 'services/toolsService.ts'],
];

function parse(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (source.parseDiagnostics.length) {
    const first = source.parseDiagnostics[0];
    throw new Error(`${filePath} is not valid TypeScript at offset ${first.start}: ${first.messageText}`);
  }
  return { text, source };
}

function findObjectLiteral(source, variableName) {
  let result;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
        result = declaration.initializer;
      }
    }
  });
  if (!result) throw new Error(`Object ${variableName} not found in ${source.fileName}`);
  return result;
}

const methodOwners = new Map();
for (const [serviceName, relativePath] of serviceFiles) {
  const filePath = path.join(root, relativePath);
  const { source } = parse(filePath);
  const object = findObjectLiteral(source, serviceName);
  for (const property of object.properties) {
    if (ts.isMethodDeclaration(property) && property.name && ts.isIdentifier(property.name)) {
      methodOwners.set(property.name.text, serviceName);
    }
  }
}

const { text, source } = parse(dataServicePath);
const facade = findObjectLiteral(source, 'dataService');
const replacements = [];
const methodsWithoutExtractedOwner = [];

for (const property of facade.properties) {
  if (!ts.isMethodDeclaration(property) || !property.body || !property.name || !ts.isIdentifier(property.name)) continue;
  const methodName = property.name.text;
  const owner = methodOwners.get(methodName);
  if (!owner) {
    methodsWithoutExtractedOwner.push(methodName);
    continue;
  }

  const bodyText = text.slice(property.body.getStart(source), property.body.end);
  
  const indent = ' '.repeat(source.getLineAndCharacterOfPosition(property.getStart(source)).character + 4);
  const replacement = `{\n${indent}return ${owner}.${methodName}.apply(${owner}, arguments as any);\n${' '.repeat(Math.max(0, indent.length - 4))}}`;
  
  const normalize = (str) => str.replace(/\s+/g, ' ').trim();
  if (normalize(bodyText) === normalize(replacement)) continue;
  replacements.push({ start: property.body.getStart(source), end: property.body.end, replacement, methodName, owner });
}

let output = text;
for (const item of replacements.sort((a, b) => b.start - a.start)) {
  output = output.slice(0, item.start) + item.replacement + output.slice(item.end);
}

fs.writeFileSync(dataServicePath, output, 'utf8');
console.log(`Delegated ${replacements.length} facade methods across ${serviceFiles.length} services.`);
console.log(`Facade methods still local (${methodsWithoutExtractedOwner.length}): ${methodsWithoutExtractedOwner.join(', ')}`);
