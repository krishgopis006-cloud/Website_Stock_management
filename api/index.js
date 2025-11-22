import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import pg from 'pg';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check - BEFORE database middleware
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database Setup
let sequelize;
let Product, Transaction, User;
let dbInitialized = false;

const initDB = async () => {
    if (dbInitialized) return;

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL is not set in environment variables');
    }

    sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        dialectModule: pg,
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        },
        logging: false
    });

    await sequelize.authenticate();

    // Define models
    Product = sequelize.define('Product', {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        price: { type: DataTypes.FLOAT, defaultValue: 0.0 },
        date: { type: DataTypes.STRING }
    });

    Transaction = sequelize.define('Transaction', {
        id: { type: DataTypes.STRING, primaryKey: true },
        type: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.FLOAT },
        channel: { type: DataTypes.STRING },
        reason: { type: DataTypes.STRING },
        timestamp: { type: DataTypes.STRING }
    });

    User = sequelize.define('User', {
        username: { type: DataTypes.STRING, primaryKey: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, defaultValue: 'guest' }
    });

    await sequelize.sync({ alter: true });

    // Seed default users
    const admin = await User.findByPk('admin');
    if (!admin) {
        await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
    }

    const guest = await User.findByPk('guest');
    if (!guest) {
        await User.create({ username: 'guest', password: 'guest123', role: 'guest' });
    }

    dbInitialized = true;
};

// DB middleware - applies to all routes AFTER this point
app.use(async (req, res, next) => {
    try {
        await initDB();
        next();
    } catch (error) {
        res.status(500).json({ error: 'Database error', details: error.message });
    }
});

// Auth
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findByPk(username);
        if (user && user.password === password) {
            res.json({ username: user.username, role: user.role });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
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
            res.send('Admin user created');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Users
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

// Inventory
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

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
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
        const product = await Product.findByPk(req.params.id);
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

app.delete('/api/inventory/reset', async (req, res) => {
    try {
        await Product.destroy({ where: {}, truncate: true });
        res.json({ message: 'All inventory cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({ order: [['timestamp', 'DESC']] });
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

app.delete('/api/transactions/reset', async (req, res) => {
    try {
        await Transaction.destroy({ where: {}, truncate: true });
        res.json({ message: 'All transactions cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export for Vercel
export default app;
