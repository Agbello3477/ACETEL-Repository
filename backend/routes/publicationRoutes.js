const express = require('express');
const { 
    createPublication, 
    getPublications, 
    getPublicPublicationById, 
    getPublicPublicationStream, 
    updatePublication, 
    deletePublication,
    exportPublications 
} = require('../controllers/publicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

const admin = authorize('Super Admin', 'Centre Admin');

// Public routes for searching/viewing publications
router.get('/public', getPublications);
router.get('/public/:id', getPublicPublicationById);
router.get('/public/:id/stream', getPublicPublicationStream);

// Protected routes (Admin only)
router.get('/export', protect, admin, exportPublications);
router.post('/', protect, admin, upload.single('pdf'), createPublication);
router.get('/', protect, admin, getPublications);
router.put('/:id', protect, admin, upload.single('pdf'), updatePublication);
router.delete('/:id', protect, admin, deletePublication);

module.exports = router;
