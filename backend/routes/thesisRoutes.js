const express = require('express');
const { createThesis, getMyTheses, getAllTheses, updateThesisStatus, updateThesis, getPublicTheses, getPublicThesisById, exportTheses, deleteThesis, streamThesisPDF } = require('../controllers/thesisController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public Routes
router.get('/public', getPublicTheses);
router.get('/public/:id', getPublicThesisById);
router.get('/public/:id/stream', streamThesisPDF); // Backend Cloud Proxy Stream

// Role Enums: 'Student', 'Centre Admin', 'Super Admin'
router.post('/', protect, authorize('Student', 'Centre Admin', 'Super Admin'), upload.single('pdf'), createThesis); // Allow admin to create for students
router.get('/my-theses', protect, getMyTheses);
router.get('/export', protect, authorize('Super Admin', 'Centre Admin'), exportTheses); // New Export Route
router.get('/', protect, authorize('Super Admin', 'Centre Admin'), getAllTheses);
router.put('/:id/status', protect, authorize('Super Admin', 'Centre Admin'), updateThesisStatus);
router.delete('/:id', protect, authorize('Super Admin', 'Centre Admin'), deleteThesis);
// Update thesis (Student only for own draft)
router.put('/:id', protect, authorize('Student'), upload.single('pdf'), updateThesis);

module.exports = router;
