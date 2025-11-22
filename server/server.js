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

// Database Setup
let sequelize;

const initializeDatabase = async () => {
    let dbUrl = process.env.DATABASE_URL;
    let dbOptions = {
        logging: false
    };

    if (dbUrl) {
        try {
            const parsedUrl = new URL(dbUrl);
            const hostname = parsedUrl.hostname;

            // If hostname is not an IP, force resolve to IPv4
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
                console.log(`🔍 Resolving hostname '${hostname}' to IPv4...`);
                let ipAddresses;

                try {
                    // Try default resolver first
                    ipAddresses = await dns.promises.resolve4(hostname);
                } catch (dnsError) {
                    console.warn(`⚠️ Default DNS failed (${dnsError.code}), trying Google DNS (8.8.8.8)...`);
                    // Fallback to Google DNS
                    dns.setServers(['8.8.8.8', '8.8.4.4']);
                    ipAddresses = await dns.promises.resolve4(hostname);
                }

                if (ipAddresses && ipAddresses.length > 0) {
                    console.log(`✅ Resolved '${hostname}' to IPv4: ${ipAddresses[0]}`);
                    // Construct new URL with IP
                    parsedUrl.hostname = ipAddresses[0];
                    dbUrl = parsedUrl.toString();
                } else {
                    throw new Error(`No IPv4 address found for ${hostname}`);
                }
            }

            dbOptions = {
                ...dbOptions,
                dialect: 'postgres',
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                }
            };

            sequelize = new Sequelize(dbUrl, dbOptions);

        } catch (error) {
            console.error('❌ CRITICAL DATABASE ERROR:', error);
            process.exit(1); // Fail hard if we can't resolve IPv4
        }
    } else {
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(__dirname, 'database.sqlite'),
            logging: false
        });
    }
};

// Initialize immediately
await initializeDatabase();


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

// Sync Database & Seed Users
sequelize.sync({ alter: true }).then(async () => {
    console.log('Database & tables created!');

    // Seed default users if they don't exist
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
});

// Routes

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



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
