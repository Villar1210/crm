import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

const settingsStr = `settings         String?  // JSON: { notifications: {}, theme: '', ... }`;
const settingsRep = `settings         String?  // JSON: { notifications: {}, theme: '', ... }\n  accountId        String?\n  account          SaasAccount? @relation("AccountUsers", fields: [accountId], references: [id])`;

if (content.includes(settingsStr) && !content.includes('accountId        String?')) {
    content = content.replace(settingsStr, settingsRep);
}

if (!content.includes('model SaasPlan')) {
const appendix = `

// ==========================================
// SAAS ADMINISTRATION MODULE
// ==========================================

model SaasPlan {
  id                   String   @id @default(uuid())
  name                 String
  description          String?
  priceMonthly         Float
  priceYearly          Float?
  maxUsers             Int?
  maxProperties        Int?
  maxWhatsAppMessages  Int?
  maxCampaigns         Int?
  modulesIncluded      String   @default("[]") // JSON Array
  isRecommended        Boolean  @default(false)
  active               Boolean  @default(true)
  
  accounts             SaasAccount[]
  invoices             SaasInvoice[]

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model SaasAccount {
  id              String   @id @default(uuid())
  name            String
  type            String   @default("outro") // imobiliaria, construtora, corretor, outro
  cnpjOrCpf       String?
  contactName     String
  contactEmail    String
  
  planId          String
  plan            SaasPlan @relation(fields: [planId], references: [id])
  
  status          String   @default("trial") // trial, active, suspended, canceled
  trialEndsAt     DateTime?
  
  modulesEnabled  String   @default("[]") // JSON Array
  deploymentType  String   @default("saas") // saas, enterprise
  
  customDomain    String?  @unique
  isWhiteLabel    Boolean  @default(false)
  notes           String?
  
  users           User[]   @relation("AccountUsers")
  invoices        SaasInvoice[]
  events          SaasEvent[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SaasInvoice {
  id              String   @id @default(uuid())
  accountId       String
  account         SaasAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  planId          String
  plan            SaasPlan @relation(fields: [planId], references: [id])
  
  amount          Float
  status          String   @default("pendente") // pago, pendente, vencido, cancelado
  
  dueDate         DateTime
  paidAt          DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SaasEvent {
  id              String   @id @default(uuid())
  type            String   // conta_criada, plano_alterado, etc
  description     String
  
  accountId       String
  account         SaasAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  timestamp       DateTime @default(now())
}
`;
    content += appendix;
}

fs.writeFileSync(schemaPath, content);
console.log("Schema updated successfully!");
