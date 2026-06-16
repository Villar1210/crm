
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
// Public Pages
const Home = lazy(() => import('./pages/Home'));
const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Jobs = lazy(() => import('./pages/Jobs'));
const FunnelLinkTree = lazy(() => import('./pages/FunnelLinkTree'));
const BuyerLogin = lazy(() => import('./pages/buyer/Login'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Register = lazy(() => import('./pages/Register'));
const BuyerDashboard = lazy(() => import('./pages/buyer/Dashboard'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Advertise = lazy(() => import('./pages/Advertise'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const CRM = lazy(() => import('./pages/admin/CRM'));
const AdminCalendar = lazy(() => import('./pages/admin/Calendar'));
const PropertiesList = lazy(() => import('./pages/admin/PropertiesList'));
const PropertyForm = lazy(() => import('./pages/admin/PropertyForm'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const Help = lazy(() => import('./pages/admin/Help'));
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig'));
const SuperAdmin = lazy(() => import('./pages/admin/SuperAdmin'));
const UsersList = lazy(() => import('./pages/admin/UsersList'));
const CampaignsList = lazy(() => import('./pages/admin/CampaignsList'));
const CampaignForm = lazy(() => import('./pages/admin/CampaignForm'));
const JobsList = lazy(() => import('./pages/admin/JobsList'));
const Marketing = lazy(() => import('./pages/admin/Marketing'));
const WhatsAppStation = lazy(() => import('./pages/admin/WhatsAppStation'));
const SiteContent = lazy(() => import('./pages/admin/SiteContent'));
const PDFTools = lazy(() => import('./pages/admin/PDFTools'));
const SignatureBuilder = lazy(() => import('./pages/admin/signatures/SignatureBuilder'));
const AssinaturasWrapper = lazy(() => import('./pages/admin/assinaturas/AssinaturasWrapper'));
const Security = lazy(() => import('./pages/admin/Security'));
const EnviarScreen = lazy(() => import('./src/modules/enviar/EnviarScreen').then(m => ({ default: m.EnviarScreen })));

import SuperAdminRoute from './routes/SuperAdminRoute';
const AdminSaaSLayout = lazy(() => import('./pages/admin/saas/AdminSaaSLayout'));
const AdminSaaSDashboard = lazy(() => import('./pages/admin/saas/AdminSaaSDashboard'));
const AdminAccounts = lazy(() => import('./pages/admin/saas/AdminAccounts'));
const AdminAccountDetails = lazy(() => import('./pages/admin/saas/AdminAccountDetails'));
const AdminPlans = lazy(() => import('./pages/admin/saas/AdminPlans'));
const AdminModules = lazy(() => import('./pages/admin/saas/AdminModules'));
const AdminBilling = lazy(() => import('./pages/admin/saas/AdminBilling'));
const AdminSystemSettings = lazy(() => import('./pages/admin/saas/AdminSystemSettings'));
const RealEstateLayout = lazy(() => import('./pages/admin/realEstate/RealEstateLayout'));
const RealEstateDashboard = lazy(() => import('./pages/admin/realEstate/Dashboard'));
const RealEstateProperties = lazy(() => import('./pages/admin/realEstate/Properties'));
const RealEstatePropertyCreate = lazy(() => import('./pages/admin/realEstate/PropertyCreate'));
const RealEstatePropertyReports = lazy(() => import('./pages/admin/realEstate/PropertyReports'));
const RealEstateContracts = lazy(() => import('./pages/admin/realEstate/Contracts'));
const RealEstateOwners = lazy(() => import('./pages/admin/realEstate/Owners'));
const RealEstateOwnerCreate = lazy(() => import('./pages/admin/realEstate/OwnerCreate'));
const RealEstateTenants = lazy(() => import('./pages/admin/realEstate/Tenants'));
const RealEstateTenantCreate = lazy(() => import('./pages/admin/realEstate/TenantCreate'));
const RealEstateFinance = lazy(() => import('./pages/admin/realEstate/Finance'));
const RealEstateInvoiceCreate = lazy(() => import('./pages/admin/realEstate/InvoiceCreate'));
const RealEstateOccupancy = lazy(() => import('./pages/admin/realEstate/Occupancy'));
const RealEstateMaintenance = lazy(() => import('./pages/admin/realEstate/Maintenance'));
const RealEstateMaintenanceCreate = lazy(() => import('./pages/admin/realEstate/MaintenanceCreate'));
const RealEstateInspections = lazy(() => import('./pages/admin/realEstate/Inspections'));
const RealEstateInspectionCreate = lazy(() => import('./pages/admin/realEstate/InspectionCreate'));
const RealEstateDocuments = lazy(() => import('./pages/admin/realEstate/Documents'));
const RealEstateReports = lazy(() => import('./pages/admin/realEstate/Reports'));
const ContractWizard = lazy(() => import('./pages/admin/realEstate/ContractWizard'));
const ContractDetails = lazy(() => import('./pages/admin/realEstate/ContractDetails'));
const EmailDashboard = lazy(() => import('./pages/admin/emailMarketing/Dashboard'));
const EmailCampaignsList = lazy(() => import('./pages/admin/emailMarketing/CampaignsList'));
const CampaignWizard = lazy(() => import('./pages/admin/emailMarketing/CampaignWizard'));


const App: React.FC = () => {
  return (
    <HelmetProvider>
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Linktree Funnel (Special Route) */}
          <Route path="/funnel" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><FunnelLinkTree /></Suspense>} />

          {/* Public Area */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Home /></Suspense>} />
            <Route path="properties" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Properties /></Suspense>} />
            <Route path="properties/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><PropertyDetails /></Suspense>} />
            <Route path="campaigns" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Campaigns /></Suspense>} />
            <Route path="jobs" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Jobs /></Suspense>} />
            <Route path="contact" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Contact /></Suspense>} />
            <Route path="about" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><About /></Suspense>} />
            <Route path="advertise" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Advertise /></Suspense>} />
            {/* Buyer Area Routes */}
            <Route path="register" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Register /></Suspense>} />
            <Route path="buyer/dashboard" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><BuyerDashboard /></Suspense>} />
          </Route>

          {/* Admin Area */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminDashboard /></Suspense>} />
            <Route path="crm" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CRM /></Suspense>} />
            <Route path="calendar" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminCalendar /></Suspense>} />
            <Route path="marketing" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Marketing /></Suspense>} />
            <Route path="whatsapp" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><WhatsAppStation /></Suspense>} />
            <Route path="properties" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><PropertiesList /></Suspense>} />
            <Route path="properties/new" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><PropertyForm /></Suspense>} />
            <Route path="properties/edit/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><PropertyForm /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><UsersList /></Suspense>} />
            <Route path="campaigns" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CampaignsList /></Suspense>} />
            <Route path="campaigns/new" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CampaignForm /></Suspense>} />
            <Route path="campaigns/edit/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CampaignForm /></Suspense>} />
            <Route path="jobs" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><JobsList /></Suspense>} />
            <Route path="site-content" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><SiteContent /></Suspense>} />
            <Route path="pdf-tools" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><PDFTools /></Suspense>} /> {/* New Route */}
            <Route path="assinaturas" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AssinaturasWrapper /></Suspense>} />
            <Route path="assinaturas/enviar" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><EnviarScreen /></Suspense>} />
            <Route path="signatures/new" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><SignatureBuilder /></Suspense>} /> {/* New Route */}

            {/* Email Marketing Routes */}
            <Route path="email-marketing" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><EmailDashboard /></Suspense>} />
            <Route path="email-marketing/campaigns" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><EmailCampaignsList /></Suspense>} />
            <Route path="email-marketing/campaigns/new" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CampaignWizard /></Suspense>} />
            <Route path="email-marketing/campaigns/:id/edit" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><CampaignWizard /></Suspense>} />

            <Route element={<SuperAdminRoute />}>
              <Route path="saas" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminSaaSLayout /></Suspense>}>
                <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminSaaSDashboard /></Suspense>} />
                <Route path="contas" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminAccounts /></Suspense>} />
                <Route path="contas/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminAccountDetails /></Suspense>} />
                <Route path="planos" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminPlans /></Suspense>} />
                <Route path="modulos" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminModules /></Suspense>} />

                <Route path="billing" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminBilling /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminSystemSettings /></Suspense>} />
              </Route>
            </Route>
            <Route path="gestao-imobiliaria" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateLayout /></Suspense>}>
              <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateDashboard /></Suspense>} />
              <Route path="imoveis/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstatePropertyCreate /></Suspense>} />
              <Route path="imoveis/relatorios" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstatePropertyReports /></Suspense>} />
              <Route path="imoveis" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateProperties /></Suspense>} />
              <Route path="contratos" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateContracts /></Suspense>} />
              <Route path="contratos/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><ContractWizard /></Suspense>} />
              <Route path="contratos/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><ContractDetails /></Suspense>} />
              <Route path="proprietarios" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateOwners /></Suspense>} />
              <Route path="proprietarios/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateOwnerCreate /></Suspense>} />
              <Route path="moradores" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateTenants /></Suspense>} />
              <Route path="moradores/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateTenantCreate /></Suspense>} />
              <Route path="financeiro" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateFinance /></Suspense>} />
              <Route path="financeiro/nova-cobranca" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateInvoiceCreate /></Suspense>} />
              <Route path="ocupacao" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateOccupancy /></Suspense>} />
              <Route path="manutencoes" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateMaintenance /></Suspense>} />
              <Route path="manutencoes/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateMaintenanceCreate /></Suspense>} />
              <Route path="vistorias" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateInspections /></Suspense>} />
              <Route path="vistorias/novo" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateInspectionCreate /></Suspense>} />
              <Route path="documentos" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateDocuments /></Suspense>} />
              <Route path="relatorios" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><RealEstateReports /></Suspense>} />
            </Route>
            <Route path="settings" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminSettings /></Suspense>} />
            <Route path="help" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><Help /></Suspense>} />
            <Route path="security" element={<Suspense fallback={<></>}><Security /></Suspense>} />
            <Route path="config" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><AdminConfig /></Suspense>} />
            <Route path="super-admin" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><SuperAdmin /></Suspense>} />
          </Route>

          {/* Catch all */}
          <Route path="login" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><BuyerLogin /></Suspense>} />
          <Route path="change-password" element={<Suspense fallback={<div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full"></div></div>}><ChangePassword /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
// Force HMR update
