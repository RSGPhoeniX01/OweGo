import express from 'express'
import { createGroup,addMembers,groupDetails,deleteGroup,editGroup, removeMembers, allGroups } from '../controllers/group.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { verifyGroupMember, verifyGroupCreator } from '../middleware/group.middleware.js';
import { checkUserNotSettled } from '../middleware/settleup.middleware.js';
const router=express.Router();

router.post('/create',userAuthentication,createGroup);
router.get('/allgroups',userAuthentication,allGroups);
router.get('/:groupId', userAuthentication, verifyGroupMember, groupDetails);
router.post('/:groupId/add-members',userAuthentication,verifyGroupCreator,checkUserNotSettled,addMembers);
router.post('/:groupId/remove-members',userAuthentication,verifyGroupCreator,checkUserNotSettled,removeMembers);
router.delete('/:groupId/delete',userAuthentication,verifyGroupCreator,checkUserNotSettled,deleteGroup);
router.put('/:groupId/edit',userAuthentication,verifyGroupCreator,checkUserNotSettled,editGroup)

export default router