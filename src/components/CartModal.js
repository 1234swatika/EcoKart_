import React, { useState, useEffect } from 'react';
import config from '../config';
import './CartModal.css';

const CartModal = ({ isOpen, onClose, user, token, onCheckout }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      fetchCart();
    }
  }, [isOpen, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCart = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const cartData = await response.json();
      setCart(cartData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      setError(err.message);
    }
  };

  const totalEcoPoints = cart.items.reduce((total, item) => total + (item.ecoPoints * item.quantity), 0);
  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>🛒 Your Cart</h2>
          <button className="cart-modal-close" onClick={onClose}>×</button>
        </div>

        {user && (
          <div className="user-info">
            <p>Welcome, {user.name}!</p>
            <p className="eco-points-display">🌱 {user.ecoPoints} EcoPoints</p>
          </div>
        )}

        {error && <div className="cart-error">{error}</div>}

        {loading ? (
          <div className="cart-loading">Loading cart...</div>
        ) : cart.items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <p>Start shopping to earn EcoPoints! 🌱</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.productName}</h4>
                    <p className="cart-item-type">
                      {item.isEcoAlternative ? '🌱 Eco-Friendly' : '🛍️ Regular'}
                    </p>
                    {item.isEcoAlternative && (
                      <p className="cart-item-points">+{item.ecoPoints} EcoPoints</p>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <button className="remove-item-btn" onClick={() => removeItem(item._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-stats">
                <p>Total Items: {totalItems}</p>
                <p className="total-eco-points">Total EcoPoints: +{totalEcoPoints}</p>
              </div>

              <div className="cart-actions">
                <button className="clear-cart-btn" onClick={clearCart}>
                  Clear Cart
                </button>
                <button className="checkout-btn" onClick={onCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
