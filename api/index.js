import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';

// Force IPv4 to avoid ENETUNREACH errors on some hosting platforms (Node 17+)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Add CORS and JSON parsing BEFORE routes
app.use(cors());
app.use(express.json());

// Database Setup
// Database Setup
let sequelize;
let dbInitPromise = null;

const initializeDatabase = async () => {
    if (sequelize) return sequelize;

    let dbUrl = process.env.DATABASE_URL;
    let dbOptions = {
        logging: false,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    };

    if (!dbUrl) {
        const errorMsg = '❌ CRITICAL: DATABASE_URL environment variable is not set. Please configure it in Vercel settings.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        console.log('Connecting to database...');
        sequelize = new Sequelize(dbUrl, dbOptions);
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Sync models
        await sequelize.sync({ alter: true });

        // Seed users
        await seedUsers();

        return sequelize;
    } catch (error) {
        console.error('❌ Database connection error:', error);
        throw error;
    }
};

const seedUsers = async () => {
    try {
        const admin = await User.findByPk('admin');
        if (!admin) {
            await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
            console.log('Admin user created');
        }

        const guest = await User.findByPk('guest');
        if (!guest) {
            await User.create({ username: 'guest', password: 'guest123', role: 'guest' });
            console.log('Guest user created');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

// Middleware to ensure DB is ready
app.use(async (req, res, next) => {
    try {
        if (!dbInitPromise) {
            dbInitPromise = initializeDatabase();
        }
        await dbInitPromise;
        next();
    } catch (error) {
        console.error('Middleware DB Error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});


// Models
const Product = sequelize.define('Product', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    price: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    date: { type: DataTypes.STRING }
});

const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.STRING, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false }, // IN, OUT, RETURN, DELETE
    name: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT },
    channel: { type: DataTypes.STRING }, // TikTok, WhatsApp, etc.
    reason: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.STRING }
});

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, primaryKey: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'guest' } // 'admin' or 'guest'
});

// Models defined above. Sync is handled in initializeDatabase.

// Routes

// Health check - doesn't need DB
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// --- User Routes ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['username', 'role'] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const existing = await User.findByPk(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const user = await User.create({ username, password, role });
        res.json({ username: user.username, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        if (username === 'admin') {
            return res.status(400).json({ error: 'Cannot delete main admin' });
        }
        const user = await User.findByPk(username);
        if (user) {
            await user.destroy();
            res.json({ message: 'User deleted' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/fix-admin', async (req, res) => {
    try {
        const admin = await User.findByPk('admin');
        if (admin) {
            await admin.update({ password: 'admin123' });
            res.send('Admin password reset to admin123');
        } else {
            await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
            res.send('Admin user created with password admin123');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: '${username}'`);

        const user = await User.findByPk(username);

        if (user && user.password === password) {
            console.log('Login success');
            res.json({ username: user.username, role: user.role });
        } else {
            console.log('Login failed: Invalid credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Inventory Routes ---
app.get('/api/inventory', async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Reset Routes ---
app.delete('/api/inventory/reset', async (req, res) => {
    try {
        await Product.destroy({ where: {}, truncate: true });
        res.json({ message: 'All inventory cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/transactions/reset', async (req, res) => {
    try {
        await Transaction.destroy({ where: {}, truncate: true });
        res.json({ message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (product) {
            await product.update(req.body);
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (product) {
            await product.destroy();
            res.json({ message: 'Product deleted' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Transaction Routes ---
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            order: [['timestamp', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = await Transaction.create(req.body);
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Export for Vercel
export default app;

// Only listen if run directly (not imported)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}
