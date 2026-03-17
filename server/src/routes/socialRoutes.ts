import { Router } from 'express';
import * as socialController from '../controllers/socialController';
import * as socialOAuthController from '../controllers/socialOAuthController';

const router = Router();

router.get('/oauth/:provider/start', socialOAuthController.startOAuth);
router.get('/oauth/:provider/callback', socialOAuthController.oauthCallback);
router.post('/oauth/:provider/disconnect', socialOAuthController.disconnectOAuth);

router.get('/connections', socialController.getConnections);
router.put('/connections/:id', socialController.updateConnection);

router.get('/posts', socialController.getPosts);
router.post('/posts', socialController.createPost);
router.put('/posts/:id', socialController.updatePost);
router.delete('/posts/:id', socialController.deletePost);

router.get('/media', socialController.getMedia);
router.post('/media', socialController.createMedia);
router.delete('/media/:id', socialController.deleteMedia);

router.get('/reports', socialController.getReports);

export default router;
