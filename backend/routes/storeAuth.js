const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../models/Store');
const StoreCustomer = require('../models/StoreCustomer');

// Helper to get store by subdomain
const getStoreBySubdomain = async (subdomain) => {
    if (!subdomain) return null;
    return await Store.findOne({ slug: subdomain }).lean();
};

// Middleware to verify Store Customer Token
const verifyStoreToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'No auth token found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.customer = decoded; // { id: customerId, storeId: storeId }
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// POST /api/store-auth/register
router.post('/register', async (req, res) => {
    try {
        const { subdomain, name, email, password } = req.body;

        if (!subdomain || !email || !password || !name) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const store = await getStoreBySubdomain(subdomain);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Check if customer exists in this store
        let customer = await StoreCustomer.findOne({ storeId: store._id, email });
        if (customer) {
            return res.status(400).json({ success: false, message: 'Customer already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create customer
        customer = await StoreCustomer.create({
            storeId: store._id,
            merchantId: store.merchant,
            name,
            email,
            passwordHash,
            marketingOptIn: req.body.marketingOptIn || false,
            lastSeenAt: new Date(),
        });

        // Create Token
        const payload = {
            customer: {
                id: customer.id,
                storeId: store._id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                    },
                });
            }
        );
    } catch (err) {
        console.error('Store Register Error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// POST /api/store-auth/login
router.post('/login', async (req, res) => {
    try {
        const { subdomain, email, password } = req.body;

        if (!subdomain || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const store = await getStoreBySubdomain(subdomain);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Find customer
        const customer = await StoreCustomer.findOne({ storeId: store._id, email });
        if (!customer) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        if (!customer.passwordHash) {
            // Handle legacy customers or guest checkouts who might not have passwords set yet?
            // For now, treat as strictly auth required.
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, customer.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last seen
        customer.lastSeenAt = new Date();
        await customer.save();

        // Create Token
        const payload = {
            customer: {
                id: customer.id,
                storeId: store._id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                    },
                });
            }
        );
    } catch (err) {
        console.error('Store Login Error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// GET /api/store-auth/me
router.get('/me', verifyStoreToken, async (req, res) => {
    try {
        const customer = await StoreCustomer.findById(req.customer.customer.id).select('-passwordHash');
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.json({ success: true, customer });
    } catch (err) {
        console.error('Store Me Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/store-auth/me
// Update basic customer profile fields (name, marketingOptIn)
router.put('/me', verifyStoreToken, async (req, res) => {
    try {
        const customerId = req.customer.customer.id;
        const { name, marketingOptIn } = req.body || {};

        const updates = {};
        if (typeof name === 'string' && name.trim().length > 0) {
            updates.name = name.trim();
        }
        if (typeof marketingOptIn === 'boolean') {
            updates.marketingOptIn = marketingOptIn;
        }

        const customer = await StoreCustomer.findByIdAndUpdate(
            customerId,
            { $set: updates },
            { new: true, runValidators: true, select: '-passwordHash' }
        );

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, customer });
    } catch (err) {
        console.error('Store Update Me Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// POST /api/store-auth/change-password
router.post('/change-password', verifyStoreToken, async (req, res) => {
    try {
        const customerId = req.customer.customer.id;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        const customer = await StoreCustomer.findById(customerId);
        if (!customer || !customer.passwordHash) {
            return res.status(400).json({ success: false, message: 'Unable to change password' });
        }

        const isMatch = await bcrypt.compare(currentPassword, customer.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        customer.passwordHash = await bcrypt.hash(newPassword, salt);
        await customer.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Store Change Password Error:', err);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

module.exports = router;
