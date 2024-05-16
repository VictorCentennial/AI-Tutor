import express from 'express';
import { handleInitialQuery, handleFollowUpQuery } from '../controllers/tutorController.js';

const router = express.Router();

router.post('/initial-query', handleInitialQuery);
router.post('/follow-up-query', handleFollowUpQuery);

export default router;
