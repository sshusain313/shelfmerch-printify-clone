/**
 * Utility to estimate cart weight
 */
export function estimateCartWeight(cartItems: Array<{ quantity: number }>): number {
    // Average weight per item in kg
    const AVG_WEIGHT_PER_ITEM_KG = 0.4;
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0.5, totalItems * AVG_WEIGHT_PER_ITEM_KG); // Minimum 0.5 kg
}
