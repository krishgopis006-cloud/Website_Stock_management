import { Menu, X, Home, TrendingUp, TrendingDown, RotateCcw, ClipboardList, FileText, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, currentPage, onNavigate }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();

    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'guest'] },
        { id: 'stock-in', label: 'Stock In', icon: TrendingUp, roles: ['admin'] },
        { id: 'stock-out', label: 'Stock Out', icon: TrendingDown, roles: ['admin'] },
        { id: 'returns', label: 'Returns', icon: RotateCcw, roles: ['admin'] },
        { id: 'inventory', label: 'Inventory', icon: ClipboardList, roles: ['admin', 'guest'] },
        { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'guest'] },
        { id: 'users', label: 'Users', icon: User, roles: ['admin'] },
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

    const handleNavigate = (id) => {
        onNavigate(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="app-layout">
            {/* Mobile Toggle */}
            <button
                className="mobile-nav-toggle btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`glass-panel sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px var(--primary-glow)'
                    }}>
                        <TrendingUp color="white" size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.2' }}>Ammachee</h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock Management</p>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                            <User size={16} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.username}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</p>
                        </div>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left',
                                    fontSize: '1rem',
                                    fontWeight: isActive ? 600 : 500
                                }}
                            >
                                <Icon size={22} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500
                        }}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="page-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
