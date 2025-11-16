const jwt = require('jsonwebtoken');

// Validate JWT secrets are set
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please set JWT_SECRET in your .env file.');
  console.error('You can generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error('ERROR: JWT_REFRESH_SECRET environment variable is not set!');
  console.error('Please set JWT_REFRESH_SECRET in your .env file.');
  console.error('You can generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = async (user, statusCode, res) => {
  try {
    console.log('Generating tokens for user:', user._id);
    console.log('User ID type:', typeof user._id);
    console.log('User ID value:', user._id);
    
    // Ensure user._id is converted to string for JWT
    const userId = user._id.toString();
    console.log('User ID as string:', userId);
    
    // Create token
    const token = generateToken(userId);
    console.log('Access token generated');
    const refreshToken = generateRefreshToken(userId);
    console.log('Refresh token generated');

    // Save refresh token to database
    user.refreshToken = refreshToken;
    console.log('Saving user with refresh token...');
    await user.save({ validateBeforeSave: false });
    console.log('User saved successfully');

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        }
      });
  } catch (error) {
    console.error('Error in sendTokenResponse:', error);
    throw error; // Re-throw to be handled by the route
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  sendTokenResponse
};

