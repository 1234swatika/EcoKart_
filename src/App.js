import React, { useEffect, useState } from 'react';
import config from './config';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import AllProducts from './pages/AllProducts';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import CheckoutModal from './components/CheckoutModal';
import EcoPointsModal from './components/EcoPointsModal';
import PastOrdersModal from './components/PastOrdersModal';
import RedeemModal from './components/RedeemModal';
import OrderSuccess from './pages/OrderSuccess';
import Chatbot from './components/Chatbot';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showEcoPointsModal, setShowEcoPointsModal] = useState(false);
  const [showPastOrdersModal, setShowPastOrdersModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refreshed user data:', data.user); // Debug log
        
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else if (response.status === 401) {
        // Token expired or invalid, clear user data
        console.log('Token expired, clearing user data');
        handleLogout();
      } else {
        console.error('Failed to refresh user data:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    // Check for existing auth on app load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Refresh user data to ensure we have the latest EcoPoints
      refreshUserData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    
    // Refresh user data to ensure we have the latest EcoPoints
    setTimeout(() => {
      refreshUserData();
    }, 100); // Reduced timeout for faster refresh
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleAddToCart = async (product, isEcoAlternative = true) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
              const response = await fetch(`${config.API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          productName: isEcoAlternative ? product.ecoAlternative : product.bestseller,
          isEcoAlternative,
          ecoPoints: isEcoAlternative ? product.pointValue : 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      alert(`Added to cart: ${isEcoAlternative ? product.ecoAlternative : product.bestseller}`);
    } catch (err) {
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

          try {
        const response = await fetch(`${config.API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

              if (response.ok) {
          const cartData = await response.json();
        setCartItems(cartData.items);
        setShowCheckoutModal(true);
        setShowCartModal(false);
      } else {
        console.error('Failed to fetch cart:', response.status);
        alert('Failed to load cart for checkout');
      }
    } catch (err) {
      console.error('Error in handleCheckout:', err);
      alert('Failed to load cart for checkout');
    }
  };

  const handleOrderComplete = async (orderData) => {
    // Refresh user data to update EcoPoints
    await refreshUserData();
    // Navigate to order success page
    window.location.href = `/order-success?data=${encodeURIComponent(JSON.stringify(orderData))}`;
  };

  const handleRewardRedeemed = () => {
    // Refresh user data when rewards are redeemed
    refreshUserData();
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar 
          user={user}
          onLogout={handleLogout}
          onShowCart={() => setShowCartModal(true)}
          onShowOrders={() => setShowPastOrdersModal(true)}
          onShowEcoPoints={() => setShowEcoPointsModal(true)}
          onShowAuth={() => setShowAuthModal(true)}
        />

        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={<Home user={user} />} 
            />
            <Route 
              path="/about" 
              element={<About />} 
            />
            <Route 
              path="/products" 
              element={
                <AllProducts 
                  user={user}
                  onAddToCart={handleAddToCart}
                  onShowAuth={() => setShowAuthModal(true)}
                />
              } 
            />
            <Route 
              path="/category/:categoryName" 
              element={
                <CategoryPage 
                  user={user}
                  onAddToCart={handleAddToCart}
                  onShowAuth={() => setShowAuthModal(true)}
                />
              } 
            />
            <Route 
              path="/product/:productId" 
              element={
                <ProductDetail 
                  user={user}
                  onAddToCart={handleAddToCart}
                  onShowAuth={() => setShowAuthModal(true)}
                />
              } 
            />
            <Route 
              path="/order-success" 
              element={<OrderSuccess />} 
            />
            <Route 
              path="/orders" 
              element={
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h2>Orders Page</h2>
                  <p>This page will show your order history.</p>
                  <button onClick={() => setShowPastOrdersModal(true)}>
                    View Past Orders
                  </button>
                </div>
              } 
            />
          </Routes>
        </main>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />

        <CartModal 
          isOpen={showCartModal}
          onClose={() => setShowCartModal(false)}
          user={user}
          token={token}
          onCheckout={handleCheckout}
        />

        <CheckoutModal 
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          user={user}
          token={token}
          cartItems={cartItems}
          onOrderComplete={handleOrderComplete}
          onRewardRedeemed={handleRewardRedeemed}
        />

        <EcoPointsModal 
          isOpen={showEcoPointsModal}
          onClose={() => setShowEcoPointsModal(false)}
          user={user}
          token={token}
          onRefresh={refreshUserData}
        />

        <PastOrdersModal 
          isOpen={showPastOrdersModal}
          onClose={() => setShowPastOrdersModal(false)}
          user={user}
          token={token}
          onRefresh={refreshUserData}
        />

        <RedeemModal 
          isOpen={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          user={user}
          token={token}
          onRefresh={refreshUserData}
        />
      </div>
      {/* Footer */}
      <footer id="footer" style={{
        width: '100%',
        textAlign: 'center',
        padding: '2rem 0 1rem 0',
        background: 'transparent',
        color: '#888',
        fontSize: '1.1rem',
        letterSpacing: '0.5px',
        marginTop: '2rem',
        borderTop: '1px solid #eee'
      }}>
        <div style={{marginBottom: '1rem'}}>
          <strong>Contact us:</strong> codeconquerors123@gmail.com
        </div>
        <div>
          <strong>Address:</strong> VIT, Vellore Campus, Tiruvalam Rd, Katpadi, Vellore, Tamil Nadu 632014, India
        </div>
      </footer>
      <Chatbot />
    </Router>
  );
}

export default App;
