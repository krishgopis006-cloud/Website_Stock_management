import { useState } from 'react';
import { useStock } from '../context/StockContext';
import { PackagePlus, PackageMinus, RotateCcw, ChevronDown, ShoppingBag } from 'lucide-react';

const StockOperation = ({ type }) => {
    const { inventory, addStock, removeStock, returnStock, transactions } = useStock();
    const [selectedProductName, setSelectedProductName] = useState('');
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [reason, setReason] = useState('');
    const [channel, setChannel] = useState('Official Website');
    const [message, setMessage] = useState('');

    // Auto-fill price when product is selected for stock out
    const handleProductChange = (productName) => {
        setSelectedProductName(productName);

        // Auto-fill price for stock out based on last selling price
        if (type === 'out' && productName && transactions && transactions.length > 0) {
            // Find the last sale transaction for this product (using 'name' field from Transaction model)
            const lastSale = transactions
                .filter(t => t.type === 'out' && t.name && t.name.toLowerCase() === productName.toLowerCase() && t.price)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            if (lastSale && lastSale.price && !isNaN(lastSale.price)) {
                setPrice(lastSale.price.toString());
            } else {
                // If no previous sale, leave it empty for user to enter
                setPrice('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProductName) {
            setMessage('Please select or enter a product name');
            return;
        }

        try {
            if (type === 'in') {
                await addStock({
                    name: selectedProductName,
                    quantity,
                    price,
                    date: new Date().toISOString()
                });
                setMessage(`Added ${quantity} units of ${selectedProductName}`);
            } else if (type === 'out') {
                // Validate stock availability before proceeding
                const product = inventory.find(item => item.name.toLowerCase() === selectedProductName.toLowerCase());
                const requestedQty = Number(quantity);
                const availableQty = product ? Number(product.quantity) : 0;

                if (requestedQty > availableQty) {
                    setMessage(`⚠️ Insufficient Stock! Only ${availableQty} units available. You requested ${requestedQty} units.`);
                    setTimeout(() => setMessage(''), 5000);
                    return;
                }

                await removeStock(selectedProductName, quantity, price, channel);
                setMessage(`Sold ${quantity} units of ${selectedProductName} via ${channel}`);
            } else if (type === 'return') {
                await returnStock(selectedProductName, quantity, reason);
                setMessage(`Returned ${quantity} units of ${selectedProductName}`);
            }

            // Clear form fields but keep the channel
            setQuantity('');
            setPrice('');
            setReason('');
            setSelectedProductName('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('An error occurred. Please try again.');
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'in': return 'Stock In (Add Inventory)';
            case 'out': return 'Stock Out (Sales)';
            case 'return': return 'Customer Returns';
            default: return '';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'in': return PackagePlus;
            case 'out': return PackageMinus;
            case 'return': return RotateCcw;
            default: return PackagePlus;
        }
    };

    const Icon = getIcon();

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon className="text-primary" />
                {getTitle()}
            </h2>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Product Selection */}
                    <div>
                        {type === 'in' ? (
                            // Stock In: Toggle between New Product and Existing Product
                            <>
                                <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    Product
                                </label>

                                {/* Toggle Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setIsNewProduct(false); handleProductChange(''); }}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: !isNewProduct ? 'var(--primary)' : 'transparent',
                                            color: !isNewProduct ? '#fff' : 'var(--text-muted)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: !isNewProduct ? '600' : '400',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Add to Existing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsNewProduct(true); handleProductChange(''); }}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: isNewProduct ? 'var(--primary)' : 'transparent',
                                            color: isNewProduct ? '#fff' : 'var(--text-muted)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: isNewProduct ? '600' : '400',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Add New Product
                                    </button>
                                </div>

                                {/* Input based on selection */}
                                {isNewProduct ? (
                                    // New Product - Text Input
                                    <div style={{ position: 'relative' }}>
                                        <PackagePlus size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={selectedProductName}
                                            onChange={(e) => setSelectedProductName(e.target.value)}
                                            placeholder="Enter new product name..."
                                            required
                                        />
                                    </div>
                                ) : (
                                    // Existing Product - Dropdown
                                    <div style={{ position: 'relative' }}>
                                        <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                        <select
                                            className="input-field"
                                            style={{ appearance: 'none', cursor: 'pointer' }}
                                            value={selectedProductName}
                                            onChange={(e) => handleProductChange(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select Existing Product --</option>
                                            {inventory.map(item => (
                                                <option key={item.id} value={item.name}>
                                                    {item.name} (Current Qty: {item.quantity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Stock Out/Return: Dropdown Select (Must pick existing)
                            <>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                    Select Product
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <select
                                        className="input-field"
                                        style={{ appearance: 'none', cursor: 'pointer' }}
                                        value={selectedProductName}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select a Product --</option>
                                        {inventory.map(item => (
                                            <option key={item.id} value={item.name}>
                                                {item.name} (Qty: {item.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Quantity</label>
                        <input
                            type="number"
                            className="input-field"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            required
                        />
                    </div>

                    {/* Price (for Sales or Stock In) */}
                    {type !== 'return' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                {type === 'out' ? 'Selling Price (Per Unit)' : 'Cost Price (Per Unit)'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>RM</span>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    step="0.01"
                                    required={type === 'out'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Sales Channel (Only for Stock Out) */}
                    {type === 'out' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sales Channel</label>
                            <div style={{ position: 'relative' }}>
                                <ShoppingBag size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <select
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                                    value={channel}
                                    onChange={(e) => setChannel(e.target.value)}
                                >
                                    <option value="Official Website">Official Website</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Lazada">Lazada</option>
                                    <option value="Shopee">Shopee</option>
                                    <option value="NVS SAMA SAMA">NVS SAMA SAMA</option>
                                    <option value="Other">Other</option>
                                </select>
                                <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                    )}

                    {/* Reason (Only for Returns) */}
                    {type === 'return' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reason for Return</label>
                            <textarea
                                className="input-field"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows="3"
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                        Confirm {type === 'in' ? 'Stock In' : type === 'out' ? 'Sale' : 'Return'}
                    </button>

                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: message.includes('⚠️') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: message.includes('⚠️') ? 'var(--danger)' : 'var(--success)',
                            textAlign: 'center',
                            marginTop: '1rem',
                            border: message.includes('⚠️') ? '1px solid var(--danger)' : 'none',
                            fontWeight: message.includes('⚠️') ? 'bold' : 'normal'
                        }}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default StockOperation;
