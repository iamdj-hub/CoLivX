const express = require('express');
const router = express.Router();

// 1. We must import ALL THREE functions we've built from the controller
const { 
  saveOnboardingData, 
  getUserProfile, 
  getPublicProfile,
  updateUserFullProfile 
} = require('../controllers/userController');
const userController = require('../controllers/userController');

// 2. Map the imported functions to their specific URL paths
router.post('/onboarding', saveOnboardingData);     // <-- This was likely line 6!
router.get('/profile/:uid', getUserProfile); 
router.get('/public/:uid', getPublicProfile); 
router.put('/update-profile', updateUserFullProfile); 
router.get('/matches/:uid', userController.getMatches);
router.post('/nlp/rebuild-keywords', userController.rebuildNlpKeywords);

module.exports = router;
