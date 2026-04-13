const express = require('express');
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Super Admin'), getUsers);
router.put('/users/:id/status', protect, authorize('Super Admin'), toggleUserStatus);
router.delete('/users/:id', protect, authorize('Super Admin'), deleteUser);

module.exports = router;
