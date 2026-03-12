const express = require('express');
const { protect } = require('../middleware/auth');
const { getVerbalDynamic, getCodeBreakerDynamic } = require('../services/datasetService');

const router = express.Router();

/** GET /api/dataset/verbal - dynamic words for Verbal IQ (merge with frontend default). */
router.get('/verbal', protect, (req, res) => {
  try {
    const words = getVerbalDynamic();
    res.json({ success: true, words });
  } catch (error) {
    console.error('Dataset verbal get error:', error);
    res.status(500).json({ success: false, error: 'Failed to load verbal dataset' });
  }
});

/** GET /api/dataset/codebreaker - dynamic words for Code Breaker. */
router.get('/codebreaker', protect, (req, res) => {
  try {
    const words = getCodeBreakerDynamic();
    res.json({ success: true, words });
  } catch (error) {
    console.error('Dataset codebreaker get error:', error);
    res.status(500).json({ success: false, error: 'Failed to load codebreaker dataset' });
  }
});

module.exports = router;
