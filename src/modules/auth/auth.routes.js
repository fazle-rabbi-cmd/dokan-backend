const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { register, login, logout, updateProfile, updatePassword } = require('./auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout); 
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

router.use(protect); 
router.patch('/admin/reset-user-password/:userId', authorize('Admin'), adminResetPassword);
router.get('/me', getMe);
router.patch('/update-profile', updateProfile); 
router.patch('/update-password', updatePassword); 

module.exports = router;