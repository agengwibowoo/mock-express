# Data Interface Mock API

A production-ready Express.js v5.1 REST API with JWT authentication, designed for easy deployment on Vercel.

## Features

- ✅ **Express.js v5.1** - Latest version of Express
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Protected Routes** - Middleware-based authorization
- 📦 **Public Endpoints** - Open access for public data
- 🚀 **Vercel Ready** - One-click deployment to Vercel
- 🎯 **RESTful API** - Clean, consistent API design

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Protected Endpoints](#protected-endpoints)
  - [Public Endpoints](#public-endpoints)
- [Deploy to Vercel](#deploy-to-vercel)
- [Demo Credentials](#demo-credentials)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd data-interface-mock
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration (especially `JWT_SECRET`).

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

**Important:** Generate a secure JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running Locally

Start the development server:

```bash
npm start
```

Or:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL
- Local: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

---

## Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123",
  "email": "john@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

**Possible Errors:**
- `400` - Missing required fields
- `409` - User already exists

---

### 2. Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "demo",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "demo",
      "email": "demo@example.com"
    }
  }
}
```

**Possible Errors:**
- `400` - Missing username or password
- `401` - Invalid credentials

---

### 3. Logout

**POST** `/api/auth/logout`

Invalidate/expire the current JWT token. This adds the token to a blacklist, effectively logging out the user and simulating an expired token.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:** None required

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful. Token has been invalidated."
}
```

**Possible Errors:**
- `401` - Authorization header is required
- `401` - Invalid authorization format
- `401` - Invalid or expired token

**Usage Notes:**
- After logout, the token will be blacklisted and cannot be used again
- Any subsequent requests with the same token will receive a `401` error with message "Token has expired or been invalidated"
- This is useful for testing expired token scenarios in your application

**Example:**
```bash
# Login first to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'

# Use the token to logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Try to use the same token again (will fail)
curl -X GET http://localhost:3000/api/protected/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Returns: {"success": false, "message": "Token has expired or been invalidated"}
```

---

## Protected Endpoints

These endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### 4. Get User Profile

**GET** `/api/protected/profile`

Retrieve authenticated user's profile.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com"
  }
}
```

**Possible Errors:**
- `401` - Missing or invalid token
- `404` - User not found

---

### 5. Get Dashboard Data

**GET** `/api/protected/dashboard`

Retrieve dashboard statistics and activity.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "demo"
    },
    "stats": {
      "totalProducts": 4,
      "totalOrders": 42,
      "revenue": 15789.50
    },
    "recentActivity": [
      {
        "id": 1,
        "action": "Product viewed",
        "timestamp": "2025-11-07T10:30:00.000Z"
      }
    ]
  }
}
```

**Possible Errors:**
- `401` - Missing or invalid token

---

## Public Endpoints

These endpoints do not require authentication.

### 6. Get Products

**GET** `/api/public/products`

Retrieve all products with optional filtering.

**Query Parameters:**
- `category` (optional) - Filter by category (e.g., "Electronics", "Furniture")
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter

**Example Request:**
```
GET /api/public/products?category=Electronics&minPrice=500
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "count": 2,
    "products": [
      {
        "id": 1,
        "name": "Laptop",
        "price": 999,
        "category": "Electronics"
      },
      {
        "id": 2,
        "name": "Phone",
        "price": 699,
        "category": "Electronics"
      }
    ]
  }
}
```

---

### 7. Health Check

**GET** `/api/public/health`

Check API health and status.

**Response (200):**
```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-07T10:30:00.000Z",
    "uptime": 3600.5,
    "environment": "production"
  }
}
```

---

## Usage Examples

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "email": "test@example.com"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "password123"
  }'
```

**Logout (invalidate token):**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Access protected endpoint:**
```bash
curl -X GET http://localhost:3000/api/protected/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get public products:**
```bash
curl -X GET "http://localhost:3000/api/public/products?category=Electronics"
```

### Using JavaScript (Fetch API)

```javascript
// Login
const login = async () => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'demo',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  const token = data.data.token;
  return token;
};

// Logout (invalidate token)
const logout = async (token) => {
  const response = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data); // { success: true, message: "Logout successful..." }
};

// Access protected endpoint
const getProfile = async (token) => {
  const response = await fetch('http://localhost:3000/api/protected/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log(data);
};

// Get public products
const getProducts = async () => {
  const response = await fetch('http://localhost:3000/api/public/products?category=Electronics');
  const data = await response.json();
  console.log(data);
};
```

---

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to complete deployment.

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure environment variables (add `JWT_SECRET`)
6. Click "Deploy"

### Environment Variables on Vercel

After deployment, add these environment variables in Vercel Dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `JWT_SECRET`: Your secure secret key
   - `NODE_ENV`: `production`

---

## Demo Credentials

For testing purposes, a demo account is available:

- **Username:** `demo`
- **Password:** `password123`
- **Email:** `demo@example.com`

---

## Project Structure

```
data-interface-mock/
├── index.js              # Main application file
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment configuration
├── .env.example         # Environment variables template
└── README.md            # This file
```

---

## Security Notes

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use strong JWT secret** - Generate a random 32-byte key for production
3. **HTTPS only in production** - Vercel provides this automatically
4. **Token expiration** - Tokens expire after 24 hours by default
5. **Password hashing** - Uses bcryptjs with salt rounds of 10

---

## Tech Stack

- **Express.js v5.1.0** - Web framework
- **jsonwebtoken v9.0.2** - JWT implementation
- **bcryptjs v2.4.3** - Password hashing
- **Node.js** - Runtime environment

---

## API Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## License

ISC

---

## Support

For issues or questions, please open an issue in the repository.

---

**Built with Express v5.1.0** 🚀

# mock-express
