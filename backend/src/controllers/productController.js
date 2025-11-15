const Product = require('../models/Product');
const logger = require('../utils/logger');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    logger.error('Get products error:', error);
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    logger.error('Get product error:', error);
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    req.body.userId = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Create product error:', error);
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    logger.error('Update product error:', error);
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    logger.error('Delete product error:', error);
    next(error);
  }
};
