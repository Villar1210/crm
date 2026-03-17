import { Router } from 'express';
import * as campaignController from '../controllers/emailCampaignController';
import * as templateController from '../controllers/emailTemplateController';
import * as automationController from '../controllers/emailAutomationController';
import * as metricsController from '../controllers/emailMetricsController';
import * as listController from '../controllers/emailListController';

const router = Router();

// ========== CAMPAIGNS ==========
router.get('/campaigns', campaignController.getCampaigns);
router.get('/campaigns/:id', campaignController.getCampaignById);
router.post('/campaigns', campaignController.createCampaign);
router.put('/campaigns/:id', campaignController.updateCampaign);
router.delete('/campaigns/:id', campaignController.deleteCampaign);
router.post('/campaigns/:id/duplicate', campaignController.duplicateCampaign);
router.post('/campaigns/:id/send', campaignController.sendCampaign);
router.post('/campaigns/:id/pause', campaignController.pauseCampaign);
router.get('/campaigns/:id/metrics', campaignController.getCampaignMetrics);
router.post('/campaigns/segment/recipients', campaignController.getSegmentRecipients);

// ========== TEMPLATES ==========
router.get('/templates', templateController.getTemplates);
router.get('/templates/:id', templateController.getTemplateById);
router.post('/templates', templateController.createTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);
router.post('/templates/:id/duplicate', templateController.duplicateTemplate);
router.post('/templates/:id/render', templateController.renderTemplate);
router.get('/templates/meta/categories', templateController.getTemplateCategories);
router.get('/templates/meta/variables', templateController.getAvailableVariables);

// ========== AUTOMATIONS ==========
router.get('/automations', automationController.getAutomations);
router.get('/automations/:id', automationController.getAutomationById);
router.post('/automations', automationController.createAutomation);
router.put('/automations/:id', automationController.updateAutomation);
router.delete('/automations/:id', automationController.deleteAutomation);
router.post('/automations/:id/toggle', automationController.toggleAutomation);
router.post('/automations/:id/test', automationController.testAutomationTrigger);
router.get('/automations/:id/history', automationController.getAutomationHistory);
router.post('/automations/:id/duplicate', automationController.duplicateAutomation);
router.get('/automations/meta/triggers', automationController.getAvailableTriggers);

// ========== METRICS & REPORTS ==========
router.get('/metrics/dashboard', metricsController.getDashboardStats);
router.get('/metrics/campaigns/:id', metricsController.getCampaignReport);
router.get('/metrics/campaigns/:id/export', metricsController.exportCampaignReport);
router.post('/metrics/campaigns/compare', metricsController.compareCampaigns);
router.get('/metrics/campaigns/:id/heatmap', metricsController.getClickHeatmap);

// ========== LISTS & CONTACTS ==========
router.get('/lists', listController.getLists);
router.get('/lists/:id', listController.getListById);
router.post('/lists', listController.createList);
router.put('/lists/:id', listController.updateList);
router.delete('/lists/:id', listController.deleteList);
router.post('/lists/:id/sync', listController.syncListWithCRM);
router.post('/lists/:id/import', listController.importContactsCSV);

router.get('/contacts', listController.getContacts);
router.post('/contacts', listController.addContact);
router.delete('/contacts/:id', listController.removeContact);
router.post('/contacts/unsubscribe', listController.unsubscribeContact);
router.put('/contacts/:id/status', listController.updateContactStatus);

export default router;
