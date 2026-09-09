const express = require('express');
const { lookupUser, sendInvitation, getMyInvitations, getSentInvitations, respondToInvitation, getConnections,  } = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);

router.get('/lookup', lookupUser);
router.post('/send', sendInvitation);
router.get('/my', getMyInvitations);
router.get('/sent', getSentInvitations);
router.put('/:id/respond', respondToInvitation);
router.get('/connections', getConnections);
module.exports = router;
