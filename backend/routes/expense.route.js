import express from 'express'
import { addExpense, updateExpense, deleteExpense, getExpense, getAllExpense, userExpense, settleGroup, getSettleStatus, getMultipleSettleStatus } from '../controllers/expense.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { verifyGroupMember } from '../middleware/group.middleware.js';
import { verifyExpenseOwner } from '../middleware/expense.middleware.js';
const router=express.Router();

router.get('/allexpenses',userAuthentication,getAllExpense);
router.post('/:groupId/addexpense',userAuthentication,verifyGroupMember,addExpense);
router.post('/:groupId/userexpense',userAuthentication,verifyGroupMember,userExpense);
router.get('/:groupId/expenses',userAuthentication,verifyGroupMember,getExpense)
router.put('/:expenseId/editexpense',userAuthentication,verifyExpenseOwner,updateExpense);
router.delete('/:expenseId/deleteexpense',userAuthentication,verifyExpenseOwner,deleteExpense);
router.post('/:groupId/settleup', userAuthentication, verifyGroupMember, settleGroup);
router.get('/:groupId/settleup/status', userAuthentication, verifyGroupMember, getSettleStatus);
router.post('/settleup/multi-status', getMultipleSettleStatus);

export default router