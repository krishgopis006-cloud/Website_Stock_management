import { useState } from 'react';
import { Settings as SettingsIcon, AlertTriangle, Trash2, Package } from 'lucide-react';
import { useStock } from '../context/StockContext';

const Settings = () => {
    const { resetAllData, resetInventoryOnly } = useStock();
    const [showConfirmAll, setShowConfirmAll] = useState(false);
    const [showConfirmProducts, setShowConfirmProducts] = useState(false);
    const [confirmTextAll, setConfirmTextAll] = useState('');
    const [confirmTextProducts, setConfirmTextProducts] = useState('');
    const [message, setMessage] = useState('');

    const handleResetAll = async () => {
        if (confirmTextAll === 'DELETE ALL') {
            await resetAllData();
            setMessage('✅ All data (products + transactions) has been cleared successfully.');
            setShowConfirmAll(false);
            setConfirmTextAll('');
            setTimeout(() => setMessage(''), 4000);
        } else {
            setMessage('❌ Please type "DELETE ALL" exactly to confirm.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleResetProducts = async () => {
        if (confirmTextProducts === 'DELETE PRODUCTS') {
            await resetInventoryOnly();
            setMessage('✅ All products have been cleared. Transaction history preserved.');
            setShowConfirmProducts(false);
            setConfirmTextProducts('');
            setTimeout(() => setMessage(''), 4000);
        } else {
            setMessage('❌ Please type "DELETE PRODUCTS" exactly to confirm.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <SettingsIcon className="text-primary" />
                Settings
            </h2>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} />
                        Danger Zone
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        These actions are irreversible. Please be careful.
                    </p>

                    {/* Clear All Products */}
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} />
                            Clear All Products
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Remove all products from inventory. Transaction history will be preserved.
                        </p>

                        {!showConfirmProducts ? (
                            <button
                                onClick={() => {
                                    setShowConfirmProducts(true);
                                    setConfirmTextProducts('');
                                }}
                                style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid var(--warning)',
                                    color: 'var(--warning)',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Package size={18} />
                                Clear All Products
                            </button>
                        ) : (
                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '2px solid var(--warning)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <h4 style={{ color: 'var(--warning)', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    ⚠️ This will delete ALL products from your inventory!
                                </h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    Your transaction history will remain intact. Type <strong>"DELETE PRODUCTS"</strong> to confirm.
                                </p>

                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Type "DELETE PRODUCTS" to confirm:
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={confirmTextProducts}
                                    onChange={(e) => setConfirmTextProducts(e.target.value)}
                                    placeholder="DELETE PRODUCTS"
                                    style={{ marginBottom: '1rem' }}
                                    autoFocus
                                />

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={handleResetProducts}
                                        style={{
                                            background: 'var(--warning)',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Confirm Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowConfirmProducts(false);
                                            setConfirmTextProducts('');
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--border-glass)',
                                            color: 'var(--text-primary)',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reset All Data */}
                    <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                            <Trash2 size={18} />
                            Reset All Data
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Completely wipe all products AND all transaction history. This cannot be undone.
                        </p>

                        {!showConfirmAll ? (
                            <button
                                onClick={() => {
                                    setShowConfirmAll(true);
                                    setConfirmTextAll('');
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid var(--danger)',
                                    color: 'var(--danger)',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Trash2 size={18} />
                                Reset All Data
                            </button>
                        ) : (
                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '2px solid var(--danger)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <h4 style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    🚨 EXTREME WARNING: This will delete EVERYTHING!
                                </h4>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    All products, sales records, stock-in/out history, and returns will be permanently deleted. Type <strong>"DELETE ALL"</strong> to proceed.
                                </p>

                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Type "DELETE ALL" to confirm:
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={confirmTextAll}
                                    onChange={(e) => setConfirmTextAll(e.target.value)}
                                    placeholder="DELETE ALL"
                                    style={{ marginBottom: '1rem' }}
                                    autoFocus
                                />

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={handleResetAll}
                                        style={{
                                            background: 'var(--danger)',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Confirm Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowConfirmAll(false);
                                            setConfirmTextAll('');
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--border-glass)',
                                            color: 'var(--text-primary)',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.includes('✅') ? 'var(--success)' : 'var(--danger)',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
