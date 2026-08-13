import express from 'express';
import { 
  addPersonalExpense, 
  getPersonalExpenses, 
  updatePersonalExpense, 
  deletePersonalExpense,
  getChartData
} from '../controllers/personalExpense.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(userAuthentication);

router.post('/add', addPersonalExpense);
router.get('/', getPersonalExpenses);
router.get('/chart', getChartData); // Aggregated time-series data for the Home analytics chart
router.put('/:expenseId/edit', updatePersonalExpense);
router.delete('/:expenseId/delete', deletePersonalExpense);

export default router;
