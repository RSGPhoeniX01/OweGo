import express from 'express'
import { getMultipleSettleStatus, getSettledGroups, getSettleStatus, settleGroup } from '../controllers/settleup.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { verifyGroupMember } from '../middleware/group.middleware.js';

const router=express.Router();

router.post('/:groupId', userAuthentication, verifyGroupMember, settleGroup);
router.get('/:groupId/status', userAuthentication, verifyGroupMember, getSettleStatus);
router.post('/multi-status', getMultipleSettleStatus);
router.get('/settled-groups', userAuthentication, getSettledGroups);

export default router;