import { createContext, useContext, useState, useEffect } from 'react';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

    // Fetch initial data
    useEffect(() => {
        fetchInventory();
        fetchTransactions();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${API_URL}/transactions`);
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const addStock = async (item) => {
        // item: { id, name, quantity, price, date }
        // Check if item exists
        const existing = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());

        if (existing) {
            // Update existing
            const updatedItem = { ...existing, quantity: Number(existing.quantity) + Number(item.quantity) };
            try {
                await fetch(`${API_URL}/inventory/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedItem)
                });
                fetchInventory(); // Refresh
            } catch (error) {
                console.error('Error updating stock:', error);
            }
        } else {
            // Create new
            try {
                await fetch(`${API_URL}/inventory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, id: Date.now().toString() })
                });
                fetchInventory();
            } catch (error) {
                console.error('Error adding stock:', error);
            }
        }

        logTransaction({ ...item, type: 'IN' });
    };

    const removeStock = async (itemName, quantity, salePrice, channel) => {
        const item = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (item) {
            const updatedQuantity = Math.max(0, Number(item.quantity) - Number(quantity));
            try {
                await fetch(`${API_URL}/inventory/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, quantity: updatedQuantity })
                });
                fetchInventory();
            } catch (error) {
                console.error('Error removing stock:', error);
            }

            logTransaction({ name: itemName, quantity, price: salePrice, type: 'OUT', channel, date: new Date().toISOString() });
        }
    };

    const returnStock = async (itemName, quantity, reason) => {
        const item = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (item) {
            const updatedQuantity = Number(item.quantity) + Number(quantity);
            try {
                await fetch(`${API_URL}/inventory/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...item, quantity: updatedQuantity })
                });
                fetchInventory();
            } catch (error) {
                console.error('Error returning stock:', error);
            }

            logTransaction({ name: itemName, quantity, reason, type: 'RETURN', date: new Date().toISOString() });
        }
    };

    const deleteProduct = async (id) => {
        const item = inventory.find(i => i.id === id);
        try {
            await fetch(`${API_URL}/inventory/${id}`, {
                method: 'DELETE'
            });

            if (item) {
                logTransaction({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    type: 'DELETE',
                    reason: 'Product removed from inventory'
                });
            }

            fetchInventory();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const logTransaction = async (transaction) => {
        try {
            const newTransaction = {
                ...transaction,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            };
            await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTransaction)
            });
            fetchTransactions();
        } catch (error) {
            console.error('Error logging transaction:', error);
        }
    };

    const getStats = () => {
        const totalItems = inventory.reduce((acc, curr) => acc + Number(curr.quantity), 0);
        const totalValue = inventory.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price || 0)), 0);

        // Calculate monthly sales
        const currentMonth = new Date().getMonth();
        const monthlySales = transactions
            .filter(t => t.type === 'OUT' && new Date(t.date || t.timestamp).getMonth() === currentMonth)
            .reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price || 0)), 0);

        return { totalItems, totalValue, monthlySales };
    };

    const resetAllData = async () => {
        try {
            await fetch(`${API_URL}/inventory/reset`, { method: 'DELETE' });
            await fetch(`${API_URL}/transactions/reset`, { method: 'DELETE' });
            fetchInventory();
            fetchTransactions();
        } catch (error) {
            console.error('Error resetting data:', error);
        }
    };

    const resetInventoryOnly = async () => {
        try {
            await fetch(`${API_URL}/inventory/reset`, { method: 'DELETE' });
            fetchInventory();
        } catch (error) {
            console.error('Error resetting inventory:', error);
        }
    };

    return (
        <StockContext.Provider value={{ inventory, transactions, addStock, removeStock, returnStock, deleteProduct, resetAllData, resetInventoryOnly, getStats }}>
            {children}
        </StockContext.Provider>
    );
};
