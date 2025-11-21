import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import StockOperation from './components/StockOperation'
import InventoryTable from './components/InventoryTable'
import Reports from './components/Reports'
import Login from './components/Login'
import UserManagement from './components/UserManagement'
import Settings from './components/Settings'
import { StockProvider } from './context/StockContext'
import { AuthProvider, useAuth } from './context/AuthContext'

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'stock-in': return <StockOperation type="in" />;
      case 'stock-out': return <StockOperation type="out" />;
      case 'returns': return <StockOperation type="return" />;
      case 'inventory': return <InventoryTable />;
      case 'reports': return <Reports />;
      case 'users': return <UserManagement />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <StockProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </StockProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
