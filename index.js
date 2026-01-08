const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory user storage (for demo purposes)
// In production, use a real database
const users = [
    {
        id: 1,
        username: "demo",
        password:
            "$2a$10$5h3tRO3AxUCZ0B0tUOUcgOcWBjc03Pa2.RKE2buj0d7lBUx8iSWy.", // hashed "password123"
        email: "demo@example.com",
    },
];

// Token blacklist (for logout functionality)
// In production, use Redis or a database with TTL
const tokenBlacklist = new Set();

// Set the token blacklist in the auth middleware
authMiddleware.setTokenBlacklist(tokenBlacklist);

// Demo data
const products = [
    { id: 1, name: "Laptop", price: 999, category: "Electronics" },
    { id: 2, name: "Phone", price: 699, category: "Electronics" },
    { id: 3, name: "Desk", price: 299, category: "Furniture" },
    { id: 4, name: "Chair", price: 199, category: "Furniture" },
];

const employeePerformance = [
    {
        emp_id: "DO248399",
        emp_no: "ID24060625",
        pos_code: "ITDIR",
        pos_id: 4512,
        dept_code: "DEPIT",
        dept_id: 4511,
        name: "adefirman",
        achievement: 5,
    },
    {
        emp_id: "DO248399",
        emp_no: "ID24060625",
        pos_code: "ITDIR",
        pos_id: 4512,
        dept_code: "DEPIT",
        dept_id: 4511,
        name: "adefirman",
        achievement: 10,
    },
    {
        emp_id: "DO130007",
        emp_no: "ID00020001",
        pos_code: "BODPD",
        pos_id: 4506,
        dept_code: "BOD",
        dept_id: 4505,
        name: "gordon",
        achievement: 1001,
    },
];

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Data Interface Mock API",
        version: "1.0.0",
        endpoints: {
            auth: {
                login: "POST /api/auth/login",
                register: "POST /api/auth/register",
                logout: "POST /api/auth/logout (requires JWT)",
            },
            protected: {
                profile: "GET /api/protected/profile (requires JWT)",
                dashboard: "GET /api/protected/dashboard (requires JWT)",
                employeePerformance:
                    "GET /api/protected/employee-performance (requires JWT)",
            },
            public: {
                products: "GET /api/public/products",
                health: "GET /api/public/health",
                employeePerformance: "GET /api/public/employee-performance",
            }, 
        },
    });
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validation
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: "Username, password, and email are required",
            });
        }

        // Check if user already exists
        const existingUser = users.find(
            (u) => u.username === username || u.email === email
        );
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            email,
        };
        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        // Find user
        const user = users.find((u) => u.username === username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

/**
 * POST /api/auth/logout
 * Invalidate/expire current JWT token (requires authentication)
 */
app.post("/api/auth/logout", authMiddleware, (req, res) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Add token to blacklist
        tokenBlacklist.add(token);

        res.json({
            success: true,
            message: "Logout successful. Token has been invalidated.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// ==========================================
// 2. PROTECTED ENDPOINTS (Requires JWT)
// ==========================================

/**
 * GET /api/protected/profile
 * Get user profile (requires authentication)
 */
app.get("/api/protected/profile", authMiddleware, (req, res) => {
    const user = users.find((u) => u.id === req.user.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.json({
        success: true,
        message: "Profile retrieved successfully",
        data: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    });
});

/**
 * GET /api/protected/dashboard
 * Get dashboard data (requires authentication)
 */
app.get("/api/protected/dashboard", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Dashboard data retrieved successfully",
        data: {
            user: {
                id: req.user.userId,
                username: req.user.username,
            },
            stats: {
                totalProducts: products.length,
                totalOrders: 42,
                revenue: 15789.5,
            },
            recentActivity: [
                {
                    id: 1,
                    action: "Product viewed",
                    timestamp: new Date().toISOString(),
                },
                {
                    id: 2,
                    action: "Login successful",
                    timestamp: new Date().toISOString(),
                },
            ],
        },
    });
});

/**
 * GET /api/protected/employee-performance
 * Get employee performance data (requires authentication)
 */
app.get("/api/protected/employee-performance", authMiddleware, (req, res) => {
    const { emp_id, pos_code, minAchievement } = req.query;

    let filteredData = [...employeePerformance];

    // Filter by employee ID
    if (emp_id) {
        filteredData = filteredData.filter(
            (e) => e.emp_id.toLowerCase() === emp_id.toLowerCase()
        );
    }

    // Filter by position code
    if (pos_code) {
        filteredData = filteredData.filter(
            (e) => e.pos_code.toLowerCase() === pos_code.toLowerCase()
        );
    }

    // Filter by minimum achievement
    if (minAchievement) {
        filteredData = filteredData.filter(
            (e) => e.achievement >= parseInt(minAchievement)
        );
    }

    res.json(filteredData);
});

// ==========================================
// 3. PUBLIC ENDPOINTS (No Authorization)
// ==========================================

/**
 * GET /api/public/products
 * Get all products (no authentication required)
 */
app.get("/api/public/products", (req, res) => {
    const { category, minPrice, maxPrice } = req.query;

    let filteredProducts = [...products];

    // Filter by category
    if (category) {
        filteredProducts = filteredProducts.filter(
            (p) => p.category.toLowerCase() === category.toLowerCase()
        );
    }

    // Filter by price range
    if (minPrice) {
        filteredProducts = filteredProducts.filter(
            (p) => p.price >= parseFloat(minPrice)
        );
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter(
            (p) => p.price <= parseFloat(maxPrice)
        );
    }

    res.json({
        success: true,
        message: "Products retrieved successfully",
        data: {
            count: filteredProducts.length,
            products: filteredProducts,
        },
    });
});

/**
 * GET /api/public/health
 * Health check endpoint (no authentication required)
 */
app.get("/api/public/health", (req, res) => {
    res.json({
        success: true,
        message: "API is running",
        data: {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
        },
    });
});

/**
 * GET /api/public/employee-performance
 * Get employee performance data (no authentication required)
 */
app.get("/api/public/employee-performance", (req, res) => {
    const { emp_id, pos_code, minAchievement } = req.query;

    let filteredData = [...employeePerformance];

    // Filter by employee ID
    if (emp_id) {
        filteredData = filteredData.filter(
            (e) => e.emp_id.toLowerCase() === emp_id.toLowerCase()
        );
    }

    // Filter by position code
    if (pos_code) {
        filteredData = filteredData.filter(
            (e) => e.pos_code.toLowerCase() === pos_code.toLowerCase()
        );
    }

    // Filter by minimum achievement
    if (minAchievement) {
        filteredData = filteredData.filter(
            (e) => e.achievement >= parseInt(minAchievement)
        );
    }

    res.json(filteredData);
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
        path: req.path,
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// Start server (for local development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📝 API Documentation: http://localhost:${PORT}/`);
        console.log(`\n🔐 Demo Credentials:`);
        console.log(`   Username: demo`);
        console.log(`   Password: password123`);
    });
}

// Export for Vercel
module.exports = app;
