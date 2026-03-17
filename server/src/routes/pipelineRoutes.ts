import { Router } from 'express';
import { getPipelines, savePipelines } from '../controllers/pipelineController';

const router = Router();

router.get('/', getPipelines);
router.put('/', savePipelines);

export default router;
