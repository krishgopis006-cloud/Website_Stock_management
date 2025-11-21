import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';
import { Search, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

const InventoryTable = () => {
    const { inventory, deleteProduct } = useStock();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableStock = filteredInventory.filter(item => Number(item.quantity) > 0);
    const outOfStock = filteredInventory.filter(item => Number(item.quantity) === 0);

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            deleteProduct(id);
        }
    };

    const StockTable = ({ items, title, icon: Icon, color }) => (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Icon size={20} color={color} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: color }}>{title}</h3>
                <span style={{
                    background: `rgba(${color === 'var(--success)' ? '16, 185, 129' : '239, 68, 68'}, 0.1)`,
                    color: color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                }}>
                    {items.length}
                </span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>SKU / ID</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Last Updated</th>
                        {user?.role === 'admin' && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? (
                        items.map(item => (
                            <tr key={item.id}>
                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.id.slice(-6)}</td>
                                <td>
                                    <span style={{
                                        color: Number(item.quantity) < 5 ? 'var(--warning)' : 'var(--success)',
                                        fontWeight: 'bold'
                                    }}>
                                        {item.quantity}
                                    </span>
                                </td>
                                <td>RM {Number(item.price).toFixed(2)}</td>
                                <td>RM {(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {new Date(Number(item.id)).toLocaleDateString()}
                                </td>
                                {user?.role === 'admin' && (
                                    <td>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--danger)',
                                                cursor: 'pointer',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Delete Product"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={user?.role === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                No items in this list.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Inventory Management</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <StockTable
                title="Available Stock"
                items={availableStock}
                icon={CheckCircle}
                color="var(--success)"
            />

            <StockTable
                title="Out of Stock"
                items={outOfStock}
                icon={AlertTriangle}
                color="var(--danger)"
            />
        </div>
    );
};

export default InventoryTable;
