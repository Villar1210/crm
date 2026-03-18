import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function clearArrayInFile(filePath, regex) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(regex, (match, p1) => `${p1} = [];`);
    fs.writeFileSync(filePath, content);
}

const saasMocksPath = path.join(__dirname, 'pages/admin/saas/adminSaasMockData.ts');
const saasRegex = /(export const (?:saasPlans|saasAccounts|saasAccountUsers|saasInvoices|saasEvents): [a-zA-Z\[\]]+) = \[[\s\S]*?\];/g;
clearArrayInFile(saasMocksPath, saasRegex);

const realEstateMocksPath = path.join(__dirname, 'mocks/realEstateMocks.ts');
const reRegex = /(export const (?:realEstateClientsMock|realEstatePropertiesMock|realEstateOwnersMock|realEstateTenantsMock|realEstateResidentsMock|realEstateContractsMock|realEstateFinancialEntriesMock): [a-zA-Z\[\]]+) = \[[\s\S]*?\];/g;
clearArrayInFile(realEstateMocksPath, reRegex);

const filesToDelete = [
    'leads.csv',
    'test_bulk.csv',
    'dev.front.log',
    'dev.front.err.log',
    'server/dev.log',
    'server/dev.err.log'
];

for (const file of filesToDelete) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted: ${file}`);
    }
}

console.log("Mock data and leftover files cleaned successfully!");
