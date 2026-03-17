import { Router } from 'express';
import * as personController from '../controllers/realEstate/personController';
import * as contractController from '../controllers/realEstate/contractController';
import * as financeController from '../controllers/realEstate/financeController';
import * as maintenanceController from '../controllers/realEstate/maintenanceController';
import * as inspectionController from '../controllers/realEstate/inspectionController';

const router = Router();

// Persons (Owners/Tenants)
router.get('/persons', personController.listPeople);
router.get('/persons/:id', personController.getPerson);
router.post('/persons', personController.createPerson);
router.put('/persons/:id', personController.updatePerson);
router.delete('/persons/:id', personController.deletePerson);

// Contracts
router.get('/contracts', contractController.listContracts);
router.get('/contracts/:id', contractController.getContract);
router.post('/contracts', contractController.createContract);
router.put('/contracts/:id', contractController.updateContract);
router.post('/contracts/:id/activate', contractController.activateContract);

// Finance
router.get('/invoices', financeController.listInvoices);
router.post('/invoices/:id/pay', financeController.payInvoice);
router.get('/payouts', financeController.listPayouts);

// Maintenance
router.get('/tickets', maintenanceController.listTickets);
router.post('/tickets', maintenanceController.createTicket);
router.put('/tickets/:id', maintenanceController.updateTicket);

// Inspections
router.get('/inspections', inspectionController.listInspections);
router.post('/inspections', inspectionController.createInspection);

export default router;
