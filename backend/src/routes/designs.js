const express = require('express');
const router = express.Router();
const {
  createDesign,
  getDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
  generateMockup,
  publishDesign,
  exportDesign,
} = require('../controllers/designController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getDesigns).post(protect, createDesign);
router.route('/:id').get(protect, getDesign).put(protect, updateDesign).delete(protect, deleteDesign);
router.post('/:id/mockup', protect, generateMockup);
router.post('/:id/publish', protect, publishDesign);
router.post('/:id/export', protect, exportDesign);

module.exports = router;
