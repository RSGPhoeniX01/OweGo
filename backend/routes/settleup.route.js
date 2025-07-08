import express from 'express'
import { getMultipleSettleStatus, getSettledGroups, getSettleStatus, settleGroup } from '../controllers/settleup.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { verifyGroupMember } from '../middleware/group.middleware.js';

const router=express.Router();

router.post('/multi-status', userAuthentication, getMultipleSettleStatus);
router.get('/settled-groups', userAuthentication, getSettledGroups);
router.post('/:groupId', userAuthentication, verifyGroupMember, settleGroup);
router.get('/:groupId/status', userAuthentication, verifyGroupMember, getSettleStatus);

export default router;