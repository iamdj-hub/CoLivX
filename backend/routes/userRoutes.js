const express = require('express');
const router = express.Router();
const { 
  saveOnboardingData, 
  getUserProfile, 
  getPublicProfile,
  updateUserFullProfile 
} = require('../controllers/userController');
const userController = require('../controllers/userController');
const {
  authenticateFirebase,
  requireAdmin,
  requireSelfBody,
  requireSelfParam
} = require('../middleware/authMiddleware');

router.post('/onboarding', authenticateFirebase, requireSelfBody(['uid']), saveOnboardingData);
router.get('/profile/:uid', authenticateFirebase, requireSelfParam('uid'), getUserProfile);
router.get('/public/:uid', getPublicProfile); 
router.put('/update-profile', authenticateFirebase, requireSelfBody(['uid']), updateUserFullProfile);
router.get('/matches/:uid', authenticateFirebase, requireSelfParam('uid'), userController.getMatches);
router.post('/nlp/rebuild-keywords', authenticateFirebase, requireAdmin, userController.rebuildNlpKeywords);

module.exports = router;
