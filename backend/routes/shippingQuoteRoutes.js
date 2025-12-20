const express = require('express');
const router = express.Router();
const axios = require('axios'); // Note: if axios is not installed, I'll use fetch or install it.

// Constants as per delhivery.md
const ORIGIN_PINCODE = "500081";      // Delhi warehouse
const MODE = "S";                      // Surface mode
const STATUS = "Delivered";            // Shipment status
const MIN_WEIGHT_GRAMS = 100;          // Minimum weight
const MAX_WEIGHT_GRAMS = 30000;        // Maximum weight (30kg)

const DELHIVERY_ENV = process.env.DELHIVERY_ENV || 'production';
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN || '586a9bf83750d1ad21a46d4cc64c8adbdfa1f349';

const getApiHost = () => {
    return DELHIVERY_ENV === 'production'
        ? 'https://track.delhivery.com'
        : 'https://staging-express.delhivery.com';
};

/**
 * Serviceability Check
 */
async function fetchServiceability(destPincode) {
    console.log(`[Delhivery Serviceability] Checking pincode: ${destPincode}`);
    const host = getApiHost();
    const url = `${host}/c/api/pin-codes/json/?filter_codes=${destPincode}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const data = response.data;

        // Delhivery API can return array or object
        let pincodeData = null;
        if (Array.isArray(data)) {
            pincodeData = data[0];
        } else if (data && data.delivery_codes && data.delivery_codes.length > 0) {
            pincodeData = data.delivery_codes[0].postal_code;
        }

        if (!pincodeData) {
            console.warn(`[Delhivery Serviceability] ✗ Pincode ${destPincode} not found`);
            return { serviceable: false };
        }

        return {
            serviceable: pincodeData.pre_paid === "Y",
            cod_available: pincodeData.cod === "Y",
            is_oda: pincodeData.is_oda === "Y",
            city: pincodeData.city,
            state_code: pincodeData.state_code,
            district: pincodeData.district,
            state: pincodeData.state,
            region: pincodeData.region
        };
    } catch (error) {
        console.error(`[Delhivery Serviceability] ✗ Error:`, error.message);
        throw error;
    }
}

/**
 * Rate Calculation
 */
async function fetchRate(originPincode, destPincode, weightGrams) {
    console.log(`[Delhivery Rate] Calculating: ${originPincode} -> ${destPincode}, weight: ${weightGrams}g`);
    const host = getApiHost();
    const url = `${host}/api/kinko/v1/invoice/charges/.json`;

    try {
        const response = await axios.get(url, {
            params: {
                o_pin: originPincode,
                d_pin: destPincode,
                cgm: weightGrams,
                md: MODE,
                ss: STATUS
            },
            headers: {
                'Authorization': `Token ${DELHIVERY_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const data = response.data;
        let rateData = Array.isArray(data) ? data[0] : data;

        const charge = rateData ? (rateData.total_amount || rateData.gross_amount) : 0;

        if (!charge || charge === 0) {
            throw new Error('Zero rate returned from API');
        }

        return {
            charge: parseFloat(charge),
            estimated_days: rateData.estimated_days || rateData.delivery_days
        };
    } catch (error) {
        console.error(`[Delhivery Rate] ✗ Error:`, error.message);
        throw error;
    }
}

/**
 * Fallback Calculator
 */
function calculateFallbackShipping(destPincode, weightGrams) {
    console.log(`[Shipping Quote] → Using Fallback Calculator for ${destPincode}`);
    const prefix = destPincode.substring(0, 2);
    let baseCharge = 99;

    // Delhi NCR
    if (prefix >= "11" && prefix <= "20") baseCharge = 50;
    // Tier 1 / South
    else if (prefix >= "40" && prefix <= "76") baseCharge = 149;
    // Nearby states
    else if ((prefix >= "12" && prefix <= "18") || (prefix >= "24" && prefix <= "34")) baseCharge = 99;

    // Weight surcharge: ₹20 per 500g above 1kg
    let surcharge = 0;
    if (weightGrams > 1000) {
        surcharge = Math.ceil((weightGrams - 1000) / 500) * 20;
    }

    return baseCharge + surcharge;
}

/**
 * Main Route Handler
 */
router.post('/', async (req, res) => {
    const { destPincode, weightGrams } = req.body;
    console.log(`[Shipping Quote] Request received for pincode: ${destPincode}, weight: ${weightGrams}g`);

    // Validation
    if (!destPincode || !/^\d{6}$/.test(destPincode)) {
        return res.status(400).json({ success: false, message: "Invalid 6-digit pin code" });
    }

    const weight = Math.max(MIN_WEIGHT_GRAMS, Math.min(weightGrams || 500, MAX_WEIGHT_GRAMS));

    try {
        // Step 1: Serviceability
        const serviceability = await fetchServiceability(destPincode);

        if (!serviceability.serviceable) {
            return res.json({
                serviceable: false,
                message: "Pincode not serviceable",
                cod_available: false,
                city: null,
                state_code: null,
                district: null,
                shipping_charge: null
            });
        }

        // Step 2: Rate Calculation
        let shippingCharge = 0;
        let rateSource = "delhivery";
        let estimatedDays = null;

        try {
            const rateResult = await fetchRate(ORIGIN_PINCODE, destPincode, weight);
            shippingCharge = rateResult.charge;
            estimatedDays = rateResult.estimated_days;
        } catch (rateError) {
            shippingCharge = calculateFallbackShipping(destPincode, weight);
            rateSource = "fallback";
        }

        return res.json({
            success: true,
            serviceable: true,
            cod_available: serviceability.cod_available,
            city: serviceability.city,
            state_code: serviceability.state_code,
            district: serviceability.district,
            is_oda: serviceability.is_oda,
            shipping_charge: shippingCharge,
            estimated_days: estimatedDays,
            rate_source: rateSource
        });

    } catch (error) {
        console.error(`[Shipping Quote] ✗ Critical Error:`, error.message);
        // Even on critical error, if we have a valid pincode, we could try fallback
        try {
            const fallbackCharge = calculateFallbackShipping(destPincode, weight);
            return res.json({
                success: true,
                serviceable: true,
                shipping_charge: fallbackCharge,
                rate_source: "fallback",
                message: "API error, used fallback"
            });
        } catch (fallbackErr) {
            return res.status(502).json({ success: false, message: "Failed to calculate shipping" });
        }
    }
});

module.exports = router;
