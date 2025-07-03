import express from 'express'
import { createGroup,addMembers,groupDetails,deleteGroup,editGroup, removeMembers } from '../controllers/group.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { getExpense } from '../controllers/expense.controller.js';
import { verifyGroupMember } from '../middleware/group.middleware.js';
const router=express.Router();

router.post('/create',userAuthentication,createGroup);
router.post('/:groupId/add-members',userAuthentication,addMembers);
router.post('/:groupId/remove-members',userAuthentication,removeMembers);
router.delete('/:groupId/delete',userAuthentication,deleteGroup);
router.put('/:groupId/edit',userAuthentication,editGroup)
router.get('/:groupId', userAuthentication, verifyGroupMember, groupDetails);
//yet to be tested
// router.get('/:groupId/expenses',userAuthentication,verifyGroupMember,getExpense)

export default router