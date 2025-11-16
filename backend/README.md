# ShelfMerch Backend - Secure Authentication

Node.js/Express backend with secure JWT-based authentication for the ShelfMerch platform.

## Features

- ✅ Secure JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Refresh token support
- ✅ Role-based access control (Admin/Merchant)
- ✅ Rate limiting for security
- ✅ Input validation
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Cookie-based token storage option

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance like MongoDB Atlas)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with secure values:
   ```env
   NODE_ENV=development
   PORT=8000
   
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=shelfmerch
   
   # IMPORTANT: Generate strong random strings for these
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production-min-32-characters
   JWT_EXPIRE=1d
   JWT_REFRESH_EXPIRE=7d
   JWT_COOKIE_EXPIRE=1
   
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses `nodemon` to automatically restart the server on file changes.

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password, role? }`
  - Returns: `{ success, user, token, refreshToken }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ success, user, token, refreshToken }`

- `POST /api/auth/logout` - Logout user (requires auth)
  - Returns: `{ success, message }`

- `GET /api/auth/me` - Get current user (requires auth)
  - Returns: `{ success, user }`

- `POST /api/auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Returns: `{ success, token, refreshToken }`

- `PUT /api/auth/updatepassword` - Update password (requires auth)
  - Body: `{ currentPassword, newPassword }`
  - Returns: `{ success, user, token, refreshToken }`

## Security Features

1. **Password Requirements:**
   - Minimum 6 characters
   - Must contain uppercase, lowercase, and number

2. **Rate Limiting:**
   - General API: 100 requests per 15 minutes per IP
   - Auth routes: 5 requests per 15 minutes per IP

3. **Token Security:**
   - Access tokens expire in 1 day (configurable)
   - Refresh tokens expire in 7 days (configurable)
   - Tokens stored in httpOnly cookies (optional)
   - Automatic token refresh on frontend

4. **Input Validation:**
   - Email format validation
   - Password strength validation
   - Name length validation

## Project Structure

```
backend/
├── models/
│   └── User.js          # User model with password hashing
├── routes/
│   └── auth.js          # Authentication routes
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── utils/
│   └── generateToken.js # Token generation utilities
├── server.js            # Main server file
├── package.json
└── .env                 # Environment variables (not in git)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `8000` |
| `MONGO_URL` | MongoDB connection string | Required |
| `DB_NAME` | Database name | Required |
| `JWT_SECRET` | Secret for access tokens | Required |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Required |
| `JWT_EXPIRE` | Access token expiration | `1d` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `7d` |
| `JWT_COOKIE_EXPIRE` | Cookie expiration (days) | `1` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |

## Generating Secure Secrets

For production, generate strong random secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Testing Authentication

### Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get current user (with token):
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## License

MIT
