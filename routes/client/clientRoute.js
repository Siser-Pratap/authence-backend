import express from 'express';
import {
  signupUser,
  signinUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/signin', signinUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);
router.put('/update-profile', updateProfile);
router.put('/change-password', changePassword);

export default router;
