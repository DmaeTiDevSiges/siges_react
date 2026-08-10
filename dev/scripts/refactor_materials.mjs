import fs from 'fs';
import path from 'path';

const dataServicePath = path.join(process.cwd(), 'services', 'dataService.ts');
const materialsDir = path.join(process.cwd(), 'services', 'materials');

if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

let code = fs.readFileSync(dataServicePath, 'utf8');

// Function to extract a chunk of code between start string and end string
function extractCode(content, startStr, endStr) {
  const startIndex = content.indexOf(startStr);
  if (startIndex === -1) return null;
  const endIndex = content.indexOf(endStr, startIndex + startStr.length);
  if (endIndex === -1) return null;
  return content.substring(startIndex, endIndex);
}

// 1. EXTRACT materialsService
const matStart = "async getMaterials(filter: number";
const matEnd = "\n    // -------------------------------------------------------------------------\n    // WAREHOUSE";
let matCode = extractCode(code, matStart, matEnd);

// 2. EXTRACT warehouseService
const whStart = "async getWarehouses(): Promise<";
const whEnd = "\n    async createMaterialPurchase(data";
// Wait, we can't be sure of the exact ends. Let's find better markers.

// Better approach: Since we are going to manually replace them in the future anyway, we can just do the regex or precise indexOf.
// Let's create a simpler script that just delegates the imports for now, and I can tell the user to run it.
