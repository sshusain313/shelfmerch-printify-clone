const Store = require('../models/Store');
const logger = require('../utils/logger');

exports.getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ userId: req.user.id });
    res.status(200).json({ success: true, count: stores.length, data: stores });
  } catch (error) {
    logger.error('Get stores error:', error);
    next(error);
  }
};

exports.getStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    logger.error('Get store error:', error);
    next(error);
  }
};

exports.getStoreBySubdomain = async (req, res, next) => {
  try {
    const store = await Store.findOne({ subdomain: req.params.subdomain });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    logger.error('Get store by subdomain error:', error);
    next(error);
  }
};

exports.createStore = async (req, res, next) => {
  try {
    req.body.userId = req.user.id;
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    logger.error('Create store error:', error);
    next(error);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    let store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    if (store.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    logger.error('Update store error:', error);
    next(error);
  }
};
