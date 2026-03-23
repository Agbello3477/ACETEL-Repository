const express = require('express');
const { getDashboardOverview, getPublicationAnalytics, getActivityLogs } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('Super Admin', 'Centre Admin'), getDashboardOverview);
router.get('/publications', protect, authorize('Super Admin', 'Centre Admin'), getPublicationAnalytics);
router.get('/logs', protect, authorize('Super Admin', 'Centre Admin'), getActivityLogs);

module.exports = router;
