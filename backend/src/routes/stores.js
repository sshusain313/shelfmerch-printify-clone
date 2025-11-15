const express = require('express');
const router = express.Router();
const { getStores, getStore, getStoreBySubdomain, createStore, updateStore } = require('../controllers/storeController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getStores).post(protect, createStore);
router.get('/subdomain/:subdomain', getStoreBySubdomain);
router.route('/:id').get(getStore).put(protect, updateStore);

module.exports = router;
