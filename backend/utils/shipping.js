/**
 * Calculate shipping charges via Delhivery API
 * @param {string} pickup_pin 
 * @param {string} delivery_pin 
 * @param {number} weight 
 * @param {string} payment_mode 
 * @returns {Promise<{charges: number, estimated_days: number}>}
 */
async function calculateShippingCharges(pickup_pin, delivery_pin, weight, payment_mode = 'Prepaid') {
    try {
        const token = process.env.DELHIVERY_TOKEN;
        if (!token) {
            console.error('DELHIVERY_TOKEN not configured');
            return { error: 'Shipping not configured' };
        }

        const params = new URLSearchParams({
            pickup_pin,
            delivery_pin,
            weight: weight.toString(),
            payment_mode
        });

        const apiUrl = `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?${params.toString()}`;

        console.log('Delhivery Request:', {
            url: apiUrl,
            tokenMasked: token ? token.substring(0, 5) + '...' : 'MISSING',
            params: params.toString()
        });

        // Expecting global fetch (Node 18+)
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delhivery API Error:', errorText);
            throw new Error(`Delhivery Request Failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Delhivery Response:', JSON.stringify(data));

        let charges = 0;
        let estimatedDays = 0;

        if (Array.isArray(data) && data.length > 0) {
            charges = data[0].total_amount;
            estimatedDays = data[0].estimated_delivery_days;
        } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            charges = data.data[0].total_amount;
            estimatedDays = data.data[0].estimated_delivery_days;
        } else {
            charges = data.total_amount || data.charges || 0;
            estimatedDays = data.estimated_delivery_days;
        }

        return {
            charges: parseFloat(charges),
            estimated_days: estimatedDays
        };

    } catch (error) {
        console.error('Shipping calculation utility error:', error);
        return { error: error.message };
    }
}

// Estimate weight logic
function estimateWeight(cart) {
    const AVG_WEIGHT_PER_ITEM_KG = 0.4;
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return Math.max(0.5, totalItems * AVG_WEIGHT_PER_ITEM_KG);
}

const DEFAULT_PICKUP_PIN = '110001';

module.exports = {
    calculateShippingCharges,
    estimateWeight,
    DEFAULT_PICKUP_PIN
};
