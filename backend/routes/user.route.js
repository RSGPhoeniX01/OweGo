import express from 'express';
import { signup, login, profile, updateUser, searchUsers } from '../controllers/user.controller.js';
import { userAuthentication } from '../middleware/user.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.put('/update', userAuthentication, updateUser);
router.get('/profile', userAuthentication, profile);
router.get('/search', userAuthentication, searchUsers);

export default router;