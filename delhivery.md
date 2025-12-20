Draft documentation for developers:
# Delhivery Shipping Calculation - Developer Reference## OverviewThe Delhivery shipping calculation system provides real-time shipping quotes by integrating with Delhivery's API. It handles serviceability checks, COD availability, shipping rate calculation, and location autofill for Indian pincodes.**Key Features:**- Real-time shipping rate calculation from Delhivery API- Serviceability check (whether pincode is deliverable)- COD (Cash on Delivery) availability check- Location details autofill (city, state, district)- Automatic fallback calculator when API fails- Environment-based configuration (staging/production)**Location:** `backend/routes/shippingQuoteRoutes.js`---## Architecture & Flow### Request Flow
Frontend (Checkout.tsx)
↓
POST /api/shipping-quote
↓
Backend Route Handler
↓
Step A: Input Validation
↓
Step B: Serviceability Check (Delhivery API)
↓
Step C: Shipping Rate Calculation (Delhivery API)
↓ (if fails)
Fallback Calculator
↓
Step D: Response to Frontend
### Detailed Flow1. **Input Validation**   - Validates pincode format (6 digits)   - Validates weight (100g - 30kg)   - Adjusts weight to minimum 100g if below threshold2. **Serviceability Check**   - Calls Delhivery pincode API: `/c/api/pin-codes/json/`   - Checks if pincode is serviceable (`pre_paid === "Y"`)   - Extracts location data (city, state, district)   - Checks COD availability (`cod === "Y"`)3. **Rate Calculation**   - Calls Delhivery rate API: `/api/kinko/v1/invoice/charges/.json`   - Uses origin pincode (500081 - Delhi warehouse)   - Calculates based on destination, weight, and mode (Surface)   - If API fails or returns zero, uses fallback calculator4. **Response**   - Returns consolidated data: serviceability, COD status, location, shipping charge   - Includes `rate_source` field indicating if rate came from API or fallback---## Key Components### 1. Main Route Handler**Endpoint:** `POST /api/shipping-quote`**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 306-421)**Request Body:**{  "destPincode": "500028",  "weightGrams": 500}**Response:**son{  "serviceable": true,  "cod_available": true,  "city": "Hyderabad",  "state_code": "TS",  "district": "Hyderabad",  "is_oda": false,  "shipping_charge": 123.45,  "rate_source": "delhivery"}### 2. Serviceability Check Function**Function:** `fetchServiceability(destPincode)`**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 47-148)**Purpose:** Checks if a pincode is serviceable by Delhivery**API Endpoint:** - Production: `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}`- Staging: `https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}`**Response Parsing:**- Handles both array and object responses from Delhivery- Extracts data from nested `postal_code` object- Returns structured serviceability data**Returns:**ascript{  serviceable: boolean,      // pre_paid === "Y"  cod_available: boolean,    // cod === "Y"  is_oda: boolean,          // is_oda === "Y" (Out of Delivery Area)  city: string,  state_code: string,  district: string,  state: string,  region: string}### 3. Rate Calculation Function**Function:** `fetchRate(originPincode, destPincode, weightGrams)`**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 188-300)**Purpose:** Fetches shipping rate from Delhivery API**API Endpoint:**- Production: `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json`- Staging: `https://staging-express.delhivery.com/api/kinko/v1/invoice/charges/.json`**Request Parameters:**avascript{  o_pin: "500081",        // Origin pincode (Delhi warehouse)  d_pin: "500028",        // Destination pincode  cgm: 500,               // Weight in grams  md: "S",                // Mode: "S" = Surface  ss: "Delivered"         // Status}**Response Handling:**- Handles array responses (extracts first element)- Validates `total_amount` or falls back to `gross_amount`- Throws error if amount is zero or invalid (triggers fallback)**Error Handling:**- 401: Authentication failed (token doesn't have access)- 404: Endpoint not found (wrong environment)- Zero amount: No pricing for lane (staging often returns this)### 4. Fallback Calculator**Function:** `calculateFallbackShipping(destPincode, weightGrams)`**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 153-179)**Purpose:** Provides zone-based shipping estimate when API fails**Logic:**- Uses first 2 digits of pincode to determine zone- Base charges by zone:  - Delhi NCR (11-20): ₹50  - Tier 1 cities (40-76): ₹149  - Nearby states (12-18, 24-34): ₹99  - Other regions: ₹99 (default)- Weight surcharge: ₹20 per 500g above 1kg**Example:**script// Pincode: 500028 (Hyderabad)// First 2 digits: 50 (Tier 1 city)// Weight: 1.5kg// Calculation: ₹149 (base) + ₹20 (0.5kg surcharge) = ₹169---## Configuration### Environment Variables**Required:**DELHIVERY_TOKEN=your_delhivery_token_here**Optional:**DELHIVERY_ENV=production  # or 'staging' (default: 'production')### Fixed Constants**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 27-32)riptconst ORIGIN_PINCODE = "500081";      // Delhi warehouseconst MODE = "S";                      // Surface modeconst STATUS = "Delivered";            // Shipment statusconst MIN_WEIGHT_GRAMS = 100;          // Minimum weightconst MAX_WEIGHT_GRAMS = 30000;        // Maximum weight (30kg)### Environment Selection**Function:** `getApiHost()`**Location:** `backend/routes/shippingQuoteRoutes.js` (lines 36-40)const DELHIVERY_ENV = process.env.DELHIVERY_ENV || 'production';const getApiHost = () => {  return DELHIVERY_ENV === 'production'     ? 'https://track.delhivery.com'    : 'https://staging-express.delhivery.com';};**Note:** Staging environment often returns zero rates. Production requires token with API access permissions.---## Error Handling & Fallbacks### Error Handling Strategy1. **Input Validation Errors** → 400 Bad Request   - Invalid pincode format   - Invalid weight (negative, zero, or > 30kg)2. **Serviceability Check Failure** → 502 Bad Gateway   - API timeout or network error   - Pincode not found in Delhivery database3. **Rate Calculation Failure** → Automatic Fallback   - API returns 401/404   - API returns zero amount   - Network timeout   - Uses `calculateFallbackShipping()` function### Fallback Trigger ConditionsThe fallback calculator is used when:- Delhivery API returns 401 (unauthorized)- Delhivery API returns 404 (not found)- Delhivery API returns zero amount- Network timeout or connection error- Any other API error**Response includes `rate_source` field:**- `"delhivery"` - Rate from Delhivery API- `"fallback"` - Rate from fallback calculator---## Frontend Integration### Usage in Checkout Component**Location:** `src/pages/Checkout.tsx` (lines 226-318)**Function:** `updateShippingQuote(pincode, qty)`**Example:**const updateShippingQuote = async (pincode: string, qty: number) => {  if (pincode.length < 6) {    // Clear state if pincode incomplete    return;  }  setZipStatus({ loading: true, serviceable: null, message: "" });  try {    // Calculate weight (assume ~200g per t-shirt)    const weightGrams = 200 * qty;    const response = await fetch('/api/shipping-quote', {      method: 'POST',      headers: { 'Content-Type': 'application/json' },      body: JSON.stringify({        destPincode: pincode,        weightGrams: weightGrams,      }),    });    const data = await response.json();    if (!response.ok || !data.serviceable) {      // Handle error or non-serviceable pincode      setZipStatus({        loading: false,        serviceable: false,        message: data.message || 'Cannot deliver to this pincode'      });      setShippingCharge(0);      setCodAvailable(false);      return;    }    // Success - update state    setZipStatus({ loading: false, serviceable: true, message: "" });    setShippingCharge(data.shipping_charge || 0);    setCodAvailable(data.cod_available === true);    // Autofill location data    if (data.city) {      setShippingForm(prev => ({ ...prev, city: data.city }));    }    if (data.state_code) {      const stateName = stateCodeToName[data.state_code] || data.state_code;      setShippingForm(prev => ({ ...prev, state: stateName }));    }  } catch (error) {    // Handle network errors    console.error('Shipping quote error:', error);  }};### Response Handling**Success Response:**ypescript{  serviceable: true,  cod_available: true,  city: "Hyderabad",  state_code: "TS",  district: "Hyderabad",  shipping_charge: 123.45,  rate_source: "delhivery" | "fallback"}**Non-Serviceable Response:**script{  serviceable: false,  message: "Pincode not serviceable",  cod_available: false,  city: null,  state_code: null,  district: null,  shipping_charge: null}---## API Details### Delhivery Serviceability API**Endpoint:** `GET /c/api/pin-codes/json/?filter_codes={pincode}`**Headers:**
Response:
{  "serviceable": true,  "cod_available": true,  "city": "Hyderabad",  "state_code": "TS",  "district": "Hyderabad",  "is_oda": false,  "shipping_charge": 123.45,  "rate_source": "delhivery"}tically.**### Delhivery Rate API**Endpoint:** `GET /api/kinko/v1/invoice/charges/.json`**Query Parameters:**- `o_pin`: Origin pincode- `d_pin`: Destination pincode- `cgm`: Weight in grams- `md`: Mode ("S" = Surface)- `ss`: Status ("Delivered")**Response Formats:**- Object: `{ total_amount: 123.45, zone: "D1", ... }`- Array: `[{ total_amount: 123.45, zone: "D1", ... }]`**Code handles both formats.**---## Logging & Debugging### Log PrefixesAll logs use consistent prefixes for easy filtering:- `[Shipping Quote]` - Main route handler- `[Delhivery Serviceability]` - Serviceability check- `[Delhivery Rate]` - Rate calculation### Log Symbols- `✓` - Success- `✗` - Failure- `→` - Action/transition- `⚠` - Warning### Example Logs
2. Serviceability Check Function
Function: fetchServiceability(destPincode)
Location: backend/routes/shippingQuoteRoutes.js (lines 47-148)
Purpose: Checks if a pincode is serviceable by Delhivery
API Endpoint:
Production: https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}
Staging: https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}
Response Parsing:
Handles both array and object responses from Delhivery
Extracts data from nested postal_code object
Returns structured serviceability data
Returns:
{  serviceable: boolean,      // pre_paid === "Y"  cod_available: boolean,    // cod === "Y"  is_oda: boolean,          // is_oda === "Y" (Out of Delivery Area)  city: string,  state_code: string,  district: string,  state: string,  region: string}Test with cURL** - Direct API testing---## Troubleshooting### Common Issues#### 1. "DELHIVERY_TOKEN not configured"**Solution:** Add token to `.env` file and restart server#### 2. API returns 401 (Unauthorized)**Causes:**- Token doesn't have access to environment (staging vs production)- Token expired or invalid- Token lacks invoice/charges API permissions**Solutions:**1. Verify token matches environment (`DELHIVERY_ENV`)2. Check token permissions in Delhivery Dashboard3. Contact Delhivery support to enable API access4. System automatically uses fallback calculator#### 3. API returns 404 (Not Found)**Causes:**- Wrong environment configured- API endpoint not available for account**Solutions:**1. Check `DELHIVERY_ENV` setting2. Try switching between staging and production3. System automatically uses fallback calculator#### 4. API returns zero shipping charges**Causes:**- Using staging environment (returns test data with zero rates)- Lane/pincode combination not priced in account- Weight too low (< 100g) - but system auto-adjusts**Solutions:**1. For real rates: set `DELHIVERY_ENV=production` with production token2. System automatically uses fallback calculator when zero is returned#### 5. All rates are from fallback**Diagnosis:** Check `rate_source` field in response**Causes:**- Using staging (expected - staging returns 0)- Production token lacks permissions (401 error)- API endpoint not found (404 error)- Network issues**Solutions:**1. For real rates: use production with proper token2. Fallback provides reasonable estimates3. Check backend logs for specific error#### 6. "Pincode not serviceable"**Solution:** Pincode exists in Delhivery database but they don't deliver to it. Consider asking customer for alternative address.---## Testing### Test with cURL# Test with valid pincodecurl -X POST http://localhost:4000/api/shipping-quote \  -H "Content-Type: application/json" \  -d '{"destPincode": "500028", "weightGrams": 500}'# Test with invalid pincodecurl -X POST http://localhost:4000/api/shipping-quote \  -H "Content-Type: application/json" \  -d '{"destPincode": "12345", "weightGrams": 500}'### Expected Responses**Success:**son{  "serviceable": true,  "cod_available": true,  "city": "Hyderabad",  "state_code": "TS",  "district": "Hyderabad",  "shipping_charge": 123.45,  "rate_source": "delhivery"}**Non-Serviceable:**{  "serviceable": false,  "message": "Pincode not serviceable",  "cod_available": false,  "city": null,  "state_code": null,  "district": null,  "shipping_charge": null}---## Security Notes1. **Token Storage:** Delhivery API token is stored server-side only (`.env` file)2. **Never Exposed:** Token is never sent to frontend or logged3. **Timeout:** All API calls have 10-second timeout4. **Input Validation:** Only valid 6-digit pincodes accepted5. **Error Messages:** Detailed errors only in development mode---## Related Files- **Main Route:** `backend/routes/shippingQuoteRoutes.js`- **Frontend Integration:** `src/pages/Checkout.tsx`- **Setup Documentation:** `backend/SHIPPING_QUOTE_SETUP.md`- **API Fixes Documentation:** `backend/DELHIVERY_API_FIXES.md`- **Array Response Fix:** `backend/DELHIVERY_ARRAY_RESPONSE_FIX.md`---## Future Improvements1. **Caching:** Cache serviceability results for frequently used pincodes2. **Multiple Origins:** Support multiple warehouse locations3. **Shipping Modes:** Support Express/Air modes in addition to Surface4. **Rate History:** Track rate changes over time5. **Analytics:** Monitor fallback usage vs API usage---## Quick Reference### API Endpoint
3. Rate Calculation Function
Function: fetchRate(originPincode, destPincode, weightGrams)
Location: backend/routes/shippingQuoteRoutes.js (lines 188-300)
Purpose: Fetches shipping rate from Delhivery API
API Endpoint:
Production: https://track.delhivery.com/api/kinko/v1/invoice/charges/.json
Staging: https://staging-express.delhivery.com/api/kinko/v1/invoice/charges/.json
Request Parameters:
{  o_pin: "500081",        // Origin pincode (Delhi warehouse)  d_pin: "500028",        // Destination pincode  cgm: 500,               // Weight in grams  md: "S",                // Mode: "S" = Surface  ss: "Delivered"         // Status}e": "delhivery"}### ConfigurationDELHIVERY_TOKEN=your_tokenDELHIVERY_ENV=production### Constants- Origin: `500081` (Delhi warehouse)- Mode: `S` (Surface)- Min Weight: `100g`- Max Weight: `30000g` (30kg)
Response Handling:
Handles array responses (extracts first element)
Validates total_amount or falls back to gross_amount
Throws error if amount is zero or invalid (triggers fallback)
Error Handling:
401: Authentication failed (token doesn't have access)
404: Endpoint not found (wrong environment)
Zero amount: No pricing for lane (staging often returns this)
4. Fallback Calculator
Function: calculateFallbackShipping(destPincode, weightGrams)
Location: backend/routes/shippingQuoteRoutes.js (lines 153-179)
Purpose: Provides zone-based shipping estimate when API fails
Logic:
Uses first 2 digits of pincode to determine zone
Base charges by zone:
Delhi NCR (11-20): ₹50
Tier 1 cities (40-76): ₹149
Nearby states (12-18, 24-34): ₹99
Other regions: ₹99 (default)
Weight surcharge: ₹20 per 500g above 1kg
Example:
// Pincode: 500028 (Hyderabad)// First 2 digits: 50 (Tier 1 city)// Weight: 1.5kg// Calculation: ₹149 (base) + ₹20 (0.5kg surcharge) = ₹169
Configuration
Environment Variables
Required:
DELHIVERY_TOKEN=your_delhivery_token_here
Optional:
DELHIVERY_ENV=production  # or 'staging' (default: 'production')
Fixed Constants
Location: backend/routes/shippingQuoteRoutes.js (lines 27-32)
const ORIGIN_PINCODE = "500081";      // Delhi warehouseconst MODE = "S";                      // Surface modeconst STATUS = "Delivered";            // Shipment statusconst MIN_WEIGHT_GRAMS = 100;          // Minimum weightconst MAX_WEIGHT_GRAMS = 30000;        // Maximum weight (30kg)
Environment Selection
Function: getApiHost()
Location: backend/routes/shippingQuoteRoutes.js (lines 36-40)
const DELHIVERY_ENV = process.env.DELHIVERY_ENV || 'production';const getApiHost = () => {  return DELHIVERY_ENV === 'production'     ? 'https://track.delhivery.com'    : 'https://staging-express.delhivery.com';};
Note: Staging environment often returns zero rates. Production requires token with API access permissions.
Error Handling & Fallbacks
Error Handling Strategy
Input Validation Errors → 400 Bad Request
Invalid pincode format
Invalid weight (negative, zero, or > 30kg)
Serviceability Check Failure → 502 Bad Gateway
API timeout or network error
Pincode not found in Delhivery database
Rate Calculation Failure → Automatic Fallback
API returns 401/404
API returns zero amount
Network timeout
Uses calculateFallbackShipping() function
Fallback Trigger Conditions
The fallback calculator is used when:
Delhivery API returns 401 (unauthorized)
Delhivery API returns 404 (not found)
Delhivery API returns zero amount
Network timeout or connection error
Any other API error
Response includes rate_source field:
"delhivery" - Rate from Delhivery API
"fallback" - Rate from fallback calculator
Frontend Integration
Usage in Checkout Component
Location: src/pages/Checkout.tsx (lines 226-318)
Function: updateShippingQuote(pincode, qty)
Example:
const updateShippingQuote = async (pincode: string, qty: number) => {  if (pincode.length < 6) {    // Clear state if pincode incomplete    return;  }  setZipStatus({ loading: true, serviceable: null, message: "" });  try {    // Calculate weight (assume ~200g per t-shirt)    const weightGrams = 200 * qty;    const response = await fetch('/api/shipping-quote', {      method: 'POST',      headers: { 'Content-Type': 'application/json' },      body: JSON.stringify({        destPincode: pincode,        weightGrams: weightGrams,      }),    });    const data = await response.json();    if (!response.ok || !data.serviceable) {      // Handle error or non-serviceable pincode      setZipStatus({        loading: false,        serviceable: false,        message: data.message || 'Cannot deliver to this pincode'      });      setShippingCharge(0);      setCodAvailable(false);      return;    }    // Success - update state    setZipStatus({ loading: false, serviceable: true, message: "" });    setShippingCharge(data.shipping_charge || 0);    setCodAvailable(data.cod_available === true);    // Autofill location data    if (data.city) {      setShippingForm(prev => ({ ...prev, city: data.city }));    }    if (data.state_code) {      const stateName = stateCodeToName[data.state_code] || data.state_code;      setShippingForm(prev => ({ ...prev, state: stateName }));    }  } catch (error) {    // Handle network errors    console.error('Shipping quote error:', error);  }};
Response Handling
Success Response:
{  serviceable: true,  cod_available: true,  city: "Hyderabad",  state_code: "TS",  district: "Hyderabad",  shipping_charge: 123.45,  rate_source: "delhivery" | "fallback"}
Non-Serviceable Response:
{  serviceable: false,  message: "Pincode not serviceable",  cod_available: false,  city: null,  state_code: null,  district: null,  shipping_charge: null}
API Details
Delhivery Serviceability API
Endpoint: GET /c/api/pin-codes/json/?filter_codes={pincode}
Headers:
Authorization: Token {DELHIVERY_TOKEN}
Response Formats:
Delhivery can return data in multiple formats:
Array of pincode objects
Object with delivery_codes array
Object with pincode as key
Code handles all formats automatically.
Delhivery Rate API
Endpoint: GET /api/kinko/v1/invoice/charges/.json
Query Parameters:
o_pin: Origin pincode
d_pin: Destination pincode
cgm: Weight in grams
md: Mode ("S" = Surface)
ss: Status ("Delivered")
Response Formats:
Object: { total_amount: 123.45, zone: "D1", ... }
Array: [{ total_amount: 123.45, zone: "D1", ... }]
Code handles both formats.
Logging & Debugging
Log Prefixes
All logs use consistent prefixes for easy filtering:
[Shipping Quote] - Main route handler
[Delhivery Serviceability] - Serviceability check
[Delhivery Rate] - Rate calculation
Log Symbols
✓ - Success
✗ - Failure
→ - Action/transition
⚠ - Warning
Example Logs
[Shipping Quote] Request received: { destPincode: '500028', weightGrams: 500 }[Delhivery Serviceability] Using host: https://track.delhivery.com[Delhivery Rate] Environment: production[Delhivery Rate] ✓ Got valid rate: 123.45 (Zone: D1)[Shipping Quote] ✓ Response: { pincode: '500028', serviceable: true, shipping_charge: 123.45, rate_source: 'delhivery' }
Debugging Tips
Check rate_source field - Indicates if using API or fallback
Check environment - Verify DELHIVERY_ENV setting
Check token - Ensure token has correct permissions
Check logs - Look for ✓ and ✗ symbols
Test with cURL - Direct API testing
Troubleshooting
Common Issues
1. "DELHIVERY_TOKEN not configured"
Solution: Add token to .env file and restart server
2. API returns 401 (Unauthorized)
Causes:
Token doesn't have access to environment (staging vs production)
Token expired or invalid
Token lacks invoice/charges API permissions
Solutions:
Verify token matches environment (DELHIVERY_ENV)
Check token permissions in Delhivery Dashboard
Contact Delhivery support to enable API access
System automatically uses fallback calculator
3. API returns 404 (Not Found)
Causes:
Wrong environment configured
API endpoint not available for account
Solutions:
Check DELHIVERY_ENV setting
Try switching between staging and production
System automatically uses fallback calculator
4. API returns zero shipping charges
Causes:
Using staging environment (returns test data with zero rates)
Lane/pincode combination not priced in account
Weight too low (< 100g) - but system auto-adjusts
Solutions:
For real rates: set DELHIVERY_ENV=production with production token
System automatically uses fallback calculator when zero is returned
5. All rates are from fallback
Diagnosis: Check rate_source field in response
Causes:
Using staging (expected - staging returns 0)
Production token lacks permissions (401 error)
API endpoint not found (404 error)
Network issues
Solutions:
For real rates: use production with proper token
Fallback provides reasonable estimates
Check backend logs for specific error
6. "Pincode not serviceable"
Solution: Pincode exists in Delhivery database but they don't deliver to it. Consider asking customer for alternative address.
Testing
Test with cURL
# Test with valid pincodecurl -X POST http://localhost:4000/api/shipping-quote \  -H "Content-Type: application/json" \  -d '{"destPincode": "500028", "weightGrams": 500}'# Test with invalid pincodecurl -X POST http://localhost:4000/api/shipping-quote \  -H "Content-Type: application/json" \  -d '{"destPincode": "12345", "weightGrams": 500}'
Expected Responses
Success:
{  "serviceable": true,  "cod_available": true,  "city": "Hyderabad",  "state_code": "TS",  "district": "Hyderabad",  "shipping_charge": 123.45,  "rate_source": "delhivery"}
Non-Serviceable:
{  "serviceable": false,  "message": "Pincode not serviceable",  "cod_available": false,  "city": null,  "state_code": null,  "district": null,  "shipping_charge": null}
Security Notes
Token Storage: Delhivery API token is stored server-side only (.env file)
Never Exposed: Token is never sent to frontend or logged
Timeout: All API calls have 10-second timeout
Input Validation: Only valid 6-digit pincodes accepted
Error Messages: Detailed errors only in development mode
Related Files
Main Route: backend/routes/shippingQuoteRoutes.js
Frontend Integration: src/pages/Checkout.tsx
Setup Documentation: backend/SHIPPING_QUOTE_SETUP.md
API Fixes Documentation: backend/DELHIVERY_API_FIXES.md
Array Response Fix: backend/DELHIVERY_ARRAY_RESPONSE_FIX.md
Future Improvements
Caching: Cache serviceability results for frequently used pincodes
Multiple Origins: Support multiple warehouse locations
Shipping Modes: Support Express/Air modes in addition to Surface
Rate History: Track rate changes over time
Analytics: Monitor fallback usage vs API usage
Quick Reference
API Endpoint
POST /api/shipping-quote
Request
{  "destPincode": "500028",  "weightGrams": 500}
Response
{  "serviceable": true,  "cod_available": true,  "city": "Hyderabad",  "state_code": "TS",  "district": "Hyderabad",  "shipping_charge": 123.45,  "rate_source": "delhivery"}
Configuration
DELHIVERY_TOKEN=your_tokenDELHIVERY_ENV=production
Constants
Origin: 500081 (Delhi warehouse)
Mode: S (Surface)
Min Weight: 100g
Max Weight: 30000g (30kg)
This document covers:- Architecture and flow- Components and functions- Configuration- Error handling and fallbacks- Frontend integration- Troubleshooting- TestingUse it as a reference when working with the Delhivery shipping calculation system.
