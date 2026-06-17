import { Router } from 'express';
import * as campaignController from '../controllers/emailCampaignController';
import * as templateController from '../controllers/emailTemplateController';
import * as automationController from '../controllers/emailAutomationController';
import * as metricsController from '../controllers/emailMetricsController';
import * as listController from '../controllers/emailListController';
import { prisma } from '../lib/prisma';

const router = Router();

// ========== TRACKING & UNSUBSCRIBE (links publicos clicados pelo destinatario) ==========
router.get('/track/open/:recipientId.gif', async (req, res) => {
    try {
        const recipient = await prisma.emailRecipient.update({
            where: { id: req.params.recipientId },
            data: { status: 'opened', openedAt: new Date() },
        });
        await prisma.emailCampaign.update({
            where: { id: recipient.campaignId },
            data: { openedCount: { increment: 1 } },
        }).catch(() => {});
    } catch { /* recipient invalido - ainda retorna o pixel */ }
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    res.send(pixel);
});

router.get('/unsubscribe/:recipientId', async (req, res) => {
    try {
        const recipient = await prisma.emailRecipient.update({
            where: { id: req.params.recipientId },
            data: { status: 'unsubscribed', unsubscribedAt: new Date() },
        });
        if (recipient?.email) {
            await prisma.emailContact.updateMany({
                where: { email: recipient.email },
                data: { status: 'unsubscribed', unsubscribeDate: new Date(), unsubscribeReason: 'Link de descadastro' },
            });
        }
        res.send('<h2 style="font-family:sans-serif;text-align:center;margin-top:60px;">Voce foi descadastrado com sucesso.</h2>');
    } catch {
        res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:60px;">Link invalido.</h2>');
    }
});

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
