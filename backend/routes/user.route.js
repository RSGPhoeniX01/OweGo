import express from 'express';
import { signup, login, profile, updateUser } from '../controllers/user.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';
import { getAllExpense } from '../controllers/expense.controller.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/update', userAuthentication, updateUser);
router.get('/profile', userAuthentication, profile);
router.get('/expenses',userAuthentication,getAllExpense);

export default router;