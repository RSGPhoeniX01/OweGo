import express from 'express'
import { addExpense, updateExpense, deleteExpense, getExpense, getAllExpense } from '../controllers/expense.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { verifyGroupMember } from '../middleware/group.middleware.js';
import { verifyExpenseOwner } from '../middleware/expense.middleware.js';
const router=express.Router();

router.get('/allexpenses',userAuthentication,getAllExpense);
router.post('/:groupId/addexpense',userAuthentication,verifyGroupMember,addExpense);
router.get('/:groupId/expenses',userAuthentication,verifyGroupMember,getExpense)
router.put('/:expenseId/editexpense',userAuthentication,verifyExpenseOwner,updateExpense);
router.delete('/:expenseId/deleteexpense',userAuthentication,verifyExpenseOwner,deleteExpense);

export default router