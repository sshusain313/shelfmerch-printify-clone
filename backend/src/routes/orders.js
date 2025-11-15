const express = require('express');
const router = express.Router();
const { getOrders, getOrder, createOrder, updateOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getOrders).post(createOrder);
router.route('/:id').get(getOrder).put(updateOrder);

module.exports = router;
