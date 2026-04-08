import express from 'express';
import { userAuthentication } from '../middleware/user.middleware.js';
import { createFeedback, getAllFeedback } from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', userAuthentication, createFeedback);
router.get('/', getAllFeedback);

export default router;