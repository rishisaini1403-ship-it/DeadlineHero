import express from 'express';
import {
  lookupUser,
  sendInvitation,
  getMyInvitations,
  getSentInvitations,
  respondToInvitation,
  getConnections,
} from '../controllers/invitation.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/lookup', lookupUser);
router.post('/send', sendInvitation);
router.get('/my', getMyInvitations);
router.get('/sent', getSentInvitations);
router.put('/:id/respond', respondToInvitation);
router.get('/connections', getConnections);

export default router;
