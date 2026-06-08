const fs = require('fs');
let code = fs.readFileSync('services/dataService.ts', 'utf8');

const replaces = [
  ['async createCompany(company: Partial<Company>)', 'async createCompany(company: Partial<Company>, onProgress?: (progress: number) => void)'],
  ['async createClient(client: Partial<Client>)', 'async createClient(client: Partial<Client>, onProgress?: (progress: number) => void)'],
  ['async uploadOrderVisitAssetPhoto(ovAssetId: string, file: File, type: \'before\' | \'after\')', 'async uploadOrderVisitAssetPhoto(ovAssetId: string, file: File, type: \'before\' | \'after\', onProgress?: (progress: number) => void)']
];

for(const [find, replace] of replaces) {
   if(code.includes(find)) {
      code = code.replace(find, replace);
      console.log('Patched: ' + find);
   } else {
      console.log('Not found: ' + find);
   }
}
fs.writeFileSync('services/dataService.ts', code, 'utf8');
