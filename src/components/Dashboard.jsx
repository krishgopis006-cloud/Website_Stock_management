import { useStock } from '../context/StockContext';
import { TrendingUp, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
    const { getStats, transactions, inventory, resetAllData } = useStock();
    const { totalItems, totalValue, monthlySales } = getStats();

    // Prepare Chart Data
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const salesData = last7Days.map(date => {
        const dayTotal = transactions
            .filter(t => t.type === 'OUT' && (t.date || t.timestamp).startsWith(date))
            .reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price || 0)), 0);
        return { date: date.slice(5), sales: dayTotal };
    });

    const stockStatusData = [
        { name: 'Available', value: inventory.filter(i => Number(i.quantity) > 0).length },
        { name: 'Out of Stock', value: inventory.filter(i => Number(i.quantity) === 0).length },
    ];

    const COLORS = ['#10b981', '#ef4444'];

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{value}</h3>
                {subtext && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtext}</p>}
            </div>
            <div style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: `rgba(${color}, 0.15)`,
                color: `rgb(${color})`
            }}>
                <Icon size={24} />
            </div>
        </div>
    );

    // Low stock threshold set to 50 units
    const lowStockItems = inventory.filter(item => Number(item.quantity) > 0 && Number(item.quantity) <= 50);

    // Out of stock items (quantity = 0)
    const outOfStockItems = inventory.filter(item => Number(item.quantity) === 0);

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard Overview</h2>
            <button onClick={async () => {
                if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                    await resetAllData();
                }
            }} className="btn btn-primary" style={{ marginBottom: '1rem' }}>Reset All Data</button>

            <div className="grid-dashboard">
                <StatCard
                    title="Total Inventory Value"
                    value={`RM ${totalValue.toFixed(2)}`}
                    icon={DollarSign}
                    color="139, 92, 246"
                />
                <StatCard
                    title="Total Items"
                    value={totalItems}
                    icon={Package}
                    color="59, 130, 246"
                />
                <StatCard
                    title="Monthly Sales"
                    value={`RM ${monthlySales.toFixed(2)}`}
                    icon={TrendingUp}
                    color="16, 185, 129"
                    subtext="Current Month"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={lowStockItems.length}
                    icon={AlertTriangle}
                    color="245, 158, 11"
                />
                <StatCard
                    title="Out of Stock"
                    value={outOfStockItems.length}
                    icon={Package}
                    color="239, 68, 68"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Sales Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sales Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="var(--primary)"
                                strokeWidth={3}
                                dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                animationDuration={1500}
                                animationBegin={0}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stock Distribution Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Stock Status</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stockStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stockStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                        {stockStatusData.map((entry, index) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index] }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{entry.name} ({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low Stock List */}
            {lowStockItems.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} />
                        Low Stock Items (≤ 50 units)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {lowStockItems.map(item => (
                            <div key={item.id} style={{
                                padding: '1rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                                <p style={{ fontWeight: 'bold' }}>{item.name}</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quantity: <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{item.quantity}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Out of Stock List */}
            {outOfStockItems.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={20} />
                        Out of Stock Items
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {outOfStockItems.map(item => (
                            <div key={item.id} style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <p style={{ fontWeight: 'bold' }}>{item.name}</p>
                                <p style={{ fontSize: '0.9rem', color: 'var--text-muted)' }}>Stock: <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Empty</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
