const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Razorpay Service
 * Centralized service for all Razorpay operations.
 * Handles instance management, order creation, and signature verification.
 */

let razorpayInstance = null;

/**
 * Get or create Razorpay instance
 * @returns {Razorpay|null} Razorpay instance or null if not configured
 */
const getInstance = () => {
    if (razorpayInstance) {
        return razorpayInstance;
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.warn('[RazorpayService] Razorpay credentials not configured');
        return null;
    }

    razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    return razorpayInstance;
};

/**
 * Get Razorpay Key ID for frontend
 * @returns {string|null}
 */
const getKeyId = () => {
    return process.env.RAZORPAY_KEY_ID || null;
};

/**
 * Create a Razorpay order
 * @param {number} amountPaise - Amount in paise
 * @param {string} currency - Currency code (INR)
 * @param {string} receipt - Receipt ID for tracking
 * @param {object} notes - Additional notes
 * @returns {Promise<object>} Razorpay order object
 */
const createOrder = async (amountPaise, currency = 'INR', receipt, notes = {}) => {
    const razorpay = getInstance();
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId) {
            throw new Error('Razorpay not configured: RAZORPAY_KEY_ID is missing in .env');
        }
        if (!keySecret) {
            throw new Error('Razorpay not configured: RAZORPAY_KEY_SECRET is missing in .env');
        }
        throw new Error('Razorpay not configured');
    }

    // Validate amount (minimum 100 paise = ₹1)
    if (!amountPaise || amountPaise < 100) {
        throw new Error('Minimum amount is ₹1 (100 paise)');
    }

    // Maximum 10 lakh (10,000,000 paise)
    if (amountPaise > 10000000) {
        throw new Error('Maximum amount is ₹1,00,000');
    }

    try {
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency,
            receipt,
            notes,
        });

        return order;
    } catch (error) {
        console.error('[RazorpayService] Order creation failed:', error);
        if (error.error && error.error.description) {
            throw new Error(`Razorpay error: ${error.error.description}`);
        }
        throw error;
    }
};

/**
 * Verify Razorpay webhook signature
 * CRITICAL: This must be used with raw body (not JSON parsed)
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (rawBody, signature) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[RazorpayService] RAZORPAY_WEBHOOK_SECRET not configured');
        return false;
    }

    if (!signature) {
        console.error('[RazorpayService] No signature provided');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (signatureBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
        console.error('[RazorpayService] Signature verification error:', error);
        return false;
    }
};

/**
 * Verify payment signature (for frontend callback verification)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Signature from frontend
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.error('[RazorpayService] RAZORPAY_KEY_SECRET not configured');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('[RazorpayService] Payment signature verification error:', error);
        return false;
    }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
const fetchPayment = async (paymentId) => {
    const razorpay = getInstance();
    if (!razorpay) {
        throw new Error('Razorpay not configured');
    }

    return razorpay.payments.fetch(paymentId);
};

/**
 * Fetch order details from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} Order details
 */
const fetchOrder = async (orderId) => {
    const razorpay = getInstance();
    if (!razorpay) {
        throw new Error('Razorpay not configured');
    }

    return razorpay.orders.fetch(orderId);
};

module.exports = {
    getInstance,
    getKeyId,
    createOrder,
    verifyWebhookSignature,
    verifyPaymentSignature,
    fetchPayment,
    fetchOrder,
};
