import { useStock } from '../context/StockContext';
import { FileDown, Calendar, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState } from 'react';

const Reports = () => {
    const { transactions, inventory } = useStock();

    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [selectedProduct, setSelectedProduct] = useState('all');

    // Get unique product names for filter
    const productNames = ['all', ...new Set(inventory.map(i => i.name))].sort();

    const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date || t.timestamp).toISOString().split('T')[0];
        const dateMatch = date >= startDate && date <= endDate;
        const productMatch = selectedProduct === 'all' || t.name.toLowerCase() === selectedProduct.toLowerCase();
        return dateMatch && productMatch;
    });

    const stockInTransactions = filteredTransactions.filter(t => t.type === 'IN' || t.type === 'RETURN');
    const stockOutTransactions = filteredTransactions.filter(t => t.type === 'OUT');
    const deletedTransactions = filteredTransactions.filter(t => t.type === 'DELETE');

    const totalSales = stockOutTransactions
        .reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price || 0)), 0);

    const totalStockInValue = stockInTransactions
        .reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price || 0)), 0);

    const generatePDF = () => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text(`Stock Report`, 14, 22);

            doc.setFontSize(12);
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 32);
            if (selectedProduct !== 'all') {
                doc.text(`Product: ${selectedProduct}`, 14, 38);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 44);
            } else {
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);
            }

            // Summary
            doc.text('Summary:', 14, selectedProduct !== 'all' ? 56 : 50);
            doc.text(`Total Sales Revenue: RM ${totalSales.toFixed(2)}`, 20, selectedProduct !== 'all' ? 66 : 60);
            doc.text(`Total Stock Added Value: RM ${totalStockInValue.toFixed(2)}`, 20, selectedProduct !== 'all' ? 73 : 67);

            let finalY = selectedProduct !== 'all' ? 86 : 80;

            // Only show inventory sections if "all" products are selected
            // OR if we want to show the specific product's current stock status
            if (selectedProduct === 'all') {
                // Separate Available Stock and Out of Stock
                const availableStock = inventory.filter(item => Number(item.quantity) > 0);
                const outOfStock = inventory.filter(item => Number(item.quantity) === 0);

                // Available Stock Section
                if (availableStock.length > 0) {
                    doc.text('Available Stock', 14, finalY);

                    const availableRows = availableStock.map(item => [
                        item.name,
                        item.quantity,
                        `RM ${Number(item.price || 0).toFixed(2)}`,
                        `RM ${(Number(item.quantity) * Number(item.price || 0)).toFixed(2)}`
                    ]);

                    autoTable(doc, {
                        head: [["Product", "Quantity", "Price/Unit", "Total Value"]],
                        body: availableRows,
                        startY: finalY + 5,
                        theme: 'grid',
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: [16, 185, 129] } // Green - healthy stock
                    });

                    finalY = doc.lastAutoTable.finalY + 20;
                }

                // Out of Stock Section
                if (outOfStock.length > 0) {
                    doc.text('Out of Stock', 14, finalY);

                    const outOfStockRows = outOfStock.map(item => [
                        item.name,
                        `RM ${Number(item.price || 0).toFixed(2)}`
                    ]);

                    autoTable(doc, {
                        head: [["Product", "Last Price/Unit"]],
                        body: outOfStockRows,
                        startY: finalY + 5,
                        theme: 'grid',
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: [239, 68, 68] } // Red - needs restocking
                    });

                    finalY = doc.lastAutoTable.finalY + 20;
                }
            } else {
                // Show current stock for selected product
                const productItem = inventory.find(i => i.name.toLowerCase() === selectedProduct.toLowerCase());
                if (productItem) {
                    doc.text('Current Stock Status', 14, finalY);

                    const rows = [[
                        productItem.name,
                        productItem.quantity,
                        `RM ${Number(productItem.price || 0).toFixed(2)}`,
                        `RM ${(Number(productItem.quantity) * Number(productItem.price || 0)).toFixed(2)}`
                    ]];

                    autoTable(doc, {
                        head: [["Product", "Quantity", "Price/Unit", "Total Value"]],
                        body: rows,
                        startY: finalY + 5,
                        theme: 'grid',
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: Number(productItem.quantity) > 0 ? [16, 185, 129] : [239, 68, 68] }
                    });

                    finalY = doc.lastAutoTable.finalY + 20;
                }
            }

            // Stock Out Table
            if (stockOutTransactions.length > 0) {
                doc.text('Stock Out (Sales)', 14, finalY);

                const outRows = stockOutTransactions.map(t => [
                    new Date(t.date || t.timestamp).toLocaleDateString(),
                    t.name,
                    t.quantity,
                    `RM ${Number(t.price).toFixed(2)}`,
                    `RM ${(Number(t.quantity) * Number(t.price)).toFixed(2)}`,
                    t.channel || '-'
                ]);

                autoTable(doc, {
                    head: [["Date", "Product", "Qty", "Price", "Total", "Channel"]],
                    body: outRows,
                    startY: finalY + 5,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [59, 130, 246] }
                });

                finalY = doc.lastAutoTable.finalY + 20;
            }

            // Stock In Table
            if (stockInTransactions.length > 0) {
                doc.text('Stock In / Returns', 14, finalY);

                const inRows = stockInTransactions.map(t => [
                    new Date(t.date || t.timestamp).toLocaleDateString(),
                    t.name,
                    t.quantity,
                    t.type === 'RETURN' ? 'Return' : 'New Stock',
                    t.reason || '-'
                ]);

                autoTable(doc, {
                    head: [["Date", "Product", "Qty", "Type", "Note"]],
                    body: inRows,
                    startY: finalY + 5,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [16, 185, 129] }
                });

                finalY = doc.lastAutoTable.finalY + 20;
            }

            // Deleted Items Table
            if (deletedTransactions.length > 0) {
                doc.text('Deleted Items', 14, finalY);

                const delRows = deletedTransactions.map(t => [
                    new Date(t.date || t.timestamp).toLocaleDateString(),
                    t.name,
                    t.quantity,
                    t.reason || '-'
                ]);

                autoTable(doc, {
                    head: [["Date", "Product", "Qty", "Reason"]],
                    body: delRows,
                    startY: finalY + 5,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [107, 114, 128] }
                });
            }

            doc.save(`stock-report-${startDate}-to-${endDate}${selectedProduct !== 'all' ? '-' + selectedProduct : ''}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF report');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Reports & Analytics</h2>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileDown size={20} />
                    Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Start Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>End Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Filter by Product</label>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="input-field"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                            >
                                <option value="all">All Products</option>
                                {productNames.filter(n => n !== 'all').map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-dashboard" style={{ marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Sales Revenue</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>RM {totalSales.toFixed(2)}</h3>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Stock Added Value</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>RM {totalStockInValue.toFixed(2)}</h3>
                </div>
            </div>

            {/* Transaction Tables */}
            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Stock Out Table */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary)' }}>Stock Out (Sales)</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                    <th>Channel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockOutTransactions.length > 0 ? (
                                    stockOutTransactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.date || t.timestamp).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 500 }}>{t.name}</td>
                                            <td>{t.quantity}</td>
                                            <td>RM {Number(t.price).toFixed(2)}</td>
                                            <td>RM {(Number(t.quantity) * Number(t.price)).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge badge-${t.channel === 'TikTok' ? 'primary' : 'success'}`}>
                                                    {t.channel || 'Direct'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No sales records found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stock In Table */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--success)' }}>Stock In / Returns</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Type</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockInTransactions.length > 0 ? (
                                    stockInTransactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.date || t.timestamp).toLocaleDateString()}</td>
                                            <td style={{ fontWeight: 500 }}>{t.name}</td>
                                            <td>{t.quantity}</td>
                                            <td>
                                                <span className={`badge badge-${t.type === 'RETURN' ? 'warning' : 'success'}`}>
                                                    {t.type === 'RETURN' ? 'Return' : 'New Stock'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>{t.reason || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No stock in records found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
