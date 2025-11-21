import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'guest'
    }
});

const resetUsers = async () => {
    try {
        await sequelize.sync();

        // Force create/update admin
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (admin) {
            await admin.update({ password: 'admin123', role: 'admin' });
            console.log('Admin user updated.');
        } else {
            await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
            console.log('Admin user created.');
        }

        // Force create/update guest
        const guest = await User.findOne({ where: { username: 'guest' } });
        if (guest) {
            await guest.update({ password: 'guest123', role: 'guest' });
            console.log('Guest user updated.');
        } else {
            await User.create({ username: 'guest', password: 'guest123', role: 'guest' });
            console.log('Guest user created.');
        }

        console.log('User reset complete.');
    } catch (error) {
        console.error('Error resetting users:', error);
    }
};

resetUsers();
