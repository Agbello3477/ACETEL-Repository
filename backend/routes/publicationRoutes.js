const express = require('express');
const { createPublication, getPublications, deletePublication } = require('../controllers/publicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const admin = authorize('Super Admin', 'Centre Admin');

// Public route for searching/viewing publications
router.get('/public', getPublications);

// Protected routes (Admin only)
router.get('/export', protect, admin, require('../controllers/publicationController').exportPublications);
router.post('/', protect, admin, upload.single('pdf'), createPublication);
router.get('/', protect, admin, getPublications);
router.delete('/:id', protect, admin, deletePublication);

module.exports = router;
