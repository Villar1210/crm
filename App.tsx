
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { ThemeProvider } from './contexts/ThemeContext';
// Public Pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Campaigns from './pages/Campaigns';
import Jobs from './pages/Jobs';
import FunnelLinkTree from './pages/FunnelLinkTree';
import BuyerLogin from './pages/buyer/Login';
import BuyerDashboard from './pages/buyer/Dashboard';
import Contact from './pages/Contact';
import About from './pages/About';
import Advertise from './pages/Advertise';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CRM from './pages/admin/CRM';
import AdminCalendar from './pages/admin/Calendar';
import PropertiesList from './pages/admin/PropertiesList';
import PropertyForm from './pages/admin/PropertyForm';
import AdminSettings from './pages/admin/Settings';
import UsersList from './pages/admin/UsersList';
import CampaignsList from './pages/admin/CampaignsList';
import CampaignForm from './pages/admin/CampaignForm';
import JobsList from './pages/admin/JobsList';
import Marketing from './pages/admin/Marketing';
import WhatsAppStation from './pages/admin/WhatsAppStation';
import SiteContent from './pages/admin/SiteContent';
import PDFTools from './pages/admin/PDFTools'; // New Page
import SignatureBuilder from './pages/admin/signatures/SignatureBuilder'; // New Page
import AssinaturasWrapper from './pages/admin/assinaturas/AssinaturasWrapper';
import { EnviarScreen } from './src/modules/enviar/EnviarScreen';

import SuperAdminRoute from './routes/SuperAdminRoute';
import AdminSaaSLayout from './pages/admin/saas/AdminSaaSLayout';
import AdminSaaSDashboard from './pages/admin/saas/AdminSaaSDashboard';
import AdminAccounts from './pages/admin/saas/AdminAccounts';
import AdminAccountDetails from './pages/admin/saas/AdminAccountDetails';
import AdminPlans from './pages/admin/saas/AdminPlans';
import AdminModules from './pages/admin/saas/AdminModules';
import AdminBilling from './pages/admin/saas/AdminBilling';
import AdminSystemSettings from './pages/admin/saas/AdminSystemSettings';
import RealEstateLayout from './pages/admin/realEstate/RealEstateLayout';
import RealEstateDashboard from './pages/admin/realEstate/Dashboard';
import RealEstateProperties from './pages/admin/realEstate/Properties';
import RealEstatePropertyCreate from './pages/admin/realEstate/PropertyCreate';
import RealEstatePropertyReports from './pages/admin/realEstate/PropertyReports';
import RealEstateContracts from './pages/admin/realEstate/Contracts';
import RealEstateOwners from './pages/admin/realEstate/Owners';
import RealEstateOwnerCreate from './pages/admin/realEstate/OwnerCreate';
import RealEstateTenants from './pages/admin/realEstate/Tenants';
import RealEstateTenantCreate from './pages/admin/realEstate/TenantCreate';
import RealEstateFinance from './pages/admin/realEstate/Finance';
import RealEstateInvoiceCreate from './pages/admin/realEstate/InvoiceCreate';
import RealEstateOccupancy from './pages/admin/realEstate/Occupancy';
import RealEstateMaintenance from './pages/admin/realEstate/Maintenance';
import RealEstateMaintenanceCreate from './pages/admin/realEstate/MaintenanceCreate';
import RealEstateInspections from './pages/admin/realEstate/Inspections';
import RealEstateInspectionCreate from './pages/admin/realEstate/InspectionCreate';
import RealEstateDocuments from './pages/admin/realEstate/Documents';
import RealEstateReports from './pages/admin/realEstate/Reports';
import ContractWizard from './pages/admin/realEstate/ContractWizard';
import ContractDetails from './pages/admin/realEstate/ContractDetails';
import EmailDashboard from './pages/admin/emailMarketing/Dashboard';
import EmailCampaignsList from './pages/admin/emailMarketing/CampaignsList';
import CampaignWizard from './pages/admin/emailMarketing/CampaignWizard';


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Linktree Funnel (Special Route) */}
          <Route path="/funnel" element={<FunnelLinkTree />} />

          {/* Public Area */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="properties" element={<Properties />} />
            <Route path="properties/:id" element={<PropertyDetails />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="contact" element={<Contact />} />
            <Route path="about" element={<About />} />
            <Route path="advertise" element={<Advertise />} />
            {/* Buyer Area Routes */}
            <Route path="buyer/login" element={<BuyerLogin />} />
            <Route path="buyer/dashboard" element={<BuyerDashboard />} />
          </Route>

          {/* Admin Area */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="crm" element={<CRM />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="whatsapp" element={<WhatsAppStation />} />
            <Route path="properties" element={<PropertiesList />} />
            <Route path="properties/new" element={<PropertyForm />} />
            <Route path="properties/edit/:id" element={<PropertyForm />} />
            <Route path="users" element={<UsersList />} />
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="campaigns/new" element={<CampaignForm />} />
            <Route path="campaigns/edit/:id" element={<CampaignForm />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="site-content" element={<SiteContent />} />
            <Route path="pdf-tools" element={<PDFTools />} /> {/* New Route */}
            <Route path="assinaturas" element={<AssinaturasWrapper />} />
            <Route path="assinaturas/enviar" element={<EnviarScreen />} />
            <Route path="signatures/new" element={<SignatureBuilder />} /> {/* New Route */}

            {/* Email Marketing Routes */}
            <Route path="email-marketing" element={<EmailDashboard />} />
            <Route path="email-marketing/campaigns" element={<EmailCampaignsList />} />
            <Route path="email-marketing/campaigns/new" element={<CampaignWizard />} />
            <Route path="email-marketing/campaigns/:id/edit" element={<CampaignWizard />} />

            <Route element={<SuperAdminRoute />}>
              <Route path="saas" element={<AdminSaaSLayout />}>
                <Route index element={<AdminSaaSDashboard />} />
                <Route path="contas" element={<AdminAccounts />} />
                <Route path="contas/:id" element={<AdminAccountDetails />} />
                <Route path="planos" element={<AdminPlans />} />
                <Route path="modulos" element={<AdminModules />} />

                <Route path="billing" element={<AdminBilling />} />
                <Route path="settings" element={<AdminSystemSettings />} />
              </Route>
            </Route>
            <Route path="gestao-imobiliaria" element={<RealEstateLayout />}>
              <Route index element={<RealEstateDashboard />} />
              <Route path="imoveis/novo" element={<RealEstatePropertyCreate />} />
              <Route path="imoveis/relatorios" element={<RealEstatePropertyReports />} />
              <Route path="imoveis" element={<RealEstateProperties />} />
              <Route path="contratos" element={<RealEstateContracts />} />
              <Route path="contratos/novo" element={<ContractWizard />} />
              <Route path="contratos/:id" element={<ContractDetails />} />
              <Route path="proprietarios" element={<RealEstateOwners />} />
              <Route path="proprietarios/novo" element={<RealEstateOwnerCreate />} />
              <Route path="moradores" element={<RealEstateTenants />} />
              <Route path="moradores/novo" element={<RealEstateTenantCreate />} />
              <Route path="financeiro" element={<RealEstateFinance />} />
              <Route path="financeiro/nova-cobranca" element={<RealEstateInvoiceCreate />} />
              <Route path="ocupacao" element={<RealEstateOccupancy />} />
              <Route path="manutencoes" element={<RealEstateMaintenance />} />
              <Route path="manutencoes/novo" element={<RealEstateMaintenanceCreate />} />
              <Route path="vistorias" element={<RealEstateInspections />} />
              <Route path="vistorias/novo" element={<RealEstateInspectionCreate />} />
              <Route path="documentos" element={<RealEstateDocuments />} />
              <Route path="relatorios" element={<RealEstateReports />} />
            </Route>
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
// Force HMR update
