import React, { useState, useEffect, useCallback } from 'react';
import config from '../config';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, user, token, cartItems, onOrderComplete, onRewardRedeemed }) => {
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  const [ecoPointsRedeemed, setEcoPointsRedeemed] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [availableRewards, setAvailableRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // New state for delivery and packaging options
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [ecoPackaging, setEcoPackaging] = useState(false);
  const [freeShippingApplied, setFreeShippingApplied] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);

  const fetchAvailableRewards = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/eco-rewards/rewards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const rewards = await response.json();
        setAvailableRewards(rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  }, [token]);

  const calculateOrderSummary = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      // Set default order summary for empty cart
      setOrderSummary({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        ecoPointsEarned: 0,
        ecoPointsRedeemed: 0,
        discountAmount: 0,
        finalTotal: 0
      });
      return;
    }

    let subtotal = 0;
    let ecoPointsEarned = 0;

    cartItems.forEach(item => {
      const price = item.isEcoAlternative ? 100 : 90; // Prices in rupees (₹100 for eco, ₹90 for non-eco)
      subtotal += price * item.quantity;
      ecoPointsEarned += (item.isEcoAlternative ? item.ecoPoints : 0) * item.quantity;
    });

    const tax = subtotal * 0.18; // 18% GST in India
    
    // Calculate shipping based on delivery option and free shipping reward
    let shipping = 0;
    if (freeShippingApplied) {
      shipping = 0; // Free shipping applied via reward
    } else if (deliveryOption === 'express') {
      shipping = 999; // ₹999 for express
    } else {
      // Standard delivery - always ₹700
      shipping = 700;
    }
    
    const total = subtotal + tax + shipping;
    
    // Add EcoPoints from delivery and packaging
    let deliveryEcoPoints = 0;
    let packagingEcoPoints = 0;
    
    if (deliveryOption === 'standard') {
      deliveryEcoPoints = 10; // +10 EcoPoints for standard delivery
      ecoPointsEarned += 10;
    }
    
    if (ecoPackaging) {
      packagingEcoPoints = 5; // +5 EcoPoints for eco-friendly packaging
      ecoPointsEarned += 5;
    }
    
    // Calculate discount from EcoPoints redemption
    let discountAmount = 0;
    if (discountApplied) {
      // 10% discount applied via reward - calculate on subtotal first
      discountAmount = Math.min(subtotal * 0.1, 2000); // 10% off subtotal up to ₹2000
    } else if (ecoPointsRedeemed > 0) {
      // Regular EcoPoints redemption: 1 rupee per EcoPoint, but max 20% of total
      discountAmount = Math.min(ecoPointsRedeemed, total * 0.2);
    }
    
    const finalTotal = Math.max(0, total - discountAmount);

    const summary = {
      subtotal,
      tax,
      shipping,
      total,
      ecoPointsEarned,
      ecoPointsRedeemed,
      discountAmount,
      finalTotal,
      deliveryEcoPoints,
      packagingEcoPoints
    };
    
    setOrderSummary(summary);
  }, [cartItems, deliveryOption, ecoPackaging, freeShippingApplied, discountApplied, ecoPointsRedeemed]);

  useEffect(() => {
    if (isOpen && user) {
      // Reset reward states when modal opens
      setEcoPointsRedeemed(0);
      setFreeShippingApplied(false);
      setDiscountApplied(false);
      
      fetchAvailableRewards();
    }
  }, [isOpen, user, fetchAvailableRewards]);

  // Recalculate order summary whenever relevant states change
  useEffect(() => {
    if (isOpen && user) {
      calculateOrderSummary();
    }
  }, [isOpen, user, calculateOrderSummary]);

  // Force recalculation when discount or shipping states change
  useEffect(() => {
    if (isOpen && user) {
      calculateOrderSummary();
    }
  }, [discountApplied, freeShippingApplied, forceUpdate, calculateOrderSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRedeemReward = async (reward) => {
    if (user.ecoPoints < reward.ecoPointsCost) {
      alert(`Insufficient EcoPoints. You have ${user.ecoPoints}, need ${reward.ecoPointsCost}`);
      return;
    }

    try {
      // Handle local reward redemption
      if (reward._id === 'discount10') {
        // For 10% discount, don't add to ecoPointsRedeemed, just set the flag
        setDiscountApplied(true);
        
        // Update user EcoPoints locally
        const updatedUser = { ...user, ecoPoints: user.ecoPoints - reward.ecoPointsCost };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Force recalculation
        setForceUpdate(prev => prev + 1);
        
        alert('10% discount applied!');
      } else if (reward._id === 'freeshipping') {
        setEcoPointsRedeemed(prev => prev + reward.ecoPointsCost);
        setFreeShippingApplied(true);
        
        // Update user EcoPoints locally
        const updatedUser = { ...user, ecoPoints: user.ecoPoints - reward.ecoPointsCost };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Force recalculation
        setForceUpdate(prev => prev + 1);
        
        alert('Free shipping applied!');
      } else {
        // Handle server-side rewards
        const response = await fetch(`${config.API_BASE_URL}/api/eco-rewards/redeem`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rewardId: reward._id })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Reward redeemed! ${result.redemption.discountAmount} discount applied.`);
          setEcoPointsRedeemed(prev => prev + reward.ecoPointsCost);
        } else {
          const error = await response.json();
          alert(error.message);
        }
      }
    } catch (error) {
      alert('Error redeeming reward');
    }
  };

  const handleCheckout = async () => {
    
    if (!cartItems || cartItems.length === 0) {
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      alert('Please fill in all shipping address fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAddress,
          ecoPointsRedeemed,
          deliveryOption,
          ecoPackaging,
          freeShippingApplied,
          discountApplied,
          frontendFinalTotal: orderSummary.finalTotal
        })
      });

      if (response.ok) {
        const result = await response.json();
        const totalEcoPoints = result.order.ecoPointsEarned + result.order.deliveryEcoPoints + result.order.packagingEcoPoints;
        
        // Update user EcoPoints locally
        const updatedUser = { ...user, ecoPoints: user.ecoPoints + totalEcoPoints };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Prepare order data for success page
        const orderData = {
          orderId: result.order.id,
          finalTotal: orderSummary.finalTotal, // Use the final total from order summary
          totalEcoPoints: orderSummary.ecoPointsEarned + orderSummary.deliveryEcoPoints + orderSummary.packagingEcoPoints,
          ecoPointsEarned: orderSummary.ecoPointsEarned,
          deliveryEcoPoints: orderSummary.deliveryEcoPoints,
          packagingEcoPoints: orderSummary.packagingEcoPoints
        };
        
        onOrderComplete(orderData);
        onClose();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error processing checkout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="checkout-content">

          
          <div className="checkout-section">
            <h3>Shipping Address</h3>
            <div className="address-form">
              <input
                type="text"
                placeholder="Street Address"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
              />
              <div className="address-row">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Delivery Options</h3>
            <div className="delivery-options">
              <div className="delivery-option">
                <input
                  type="radio"
                  id="standard"
                  name="delivery"
                  value="standard"
                  checked={deliveryOption === 'standard'}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                />
                <label htmlFor="standard">
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-name">Standard Delivery</span>
                      <span className="option-price">
                        {freeShippingApplied ? 'FREE (Reward Applied)' : '₹700'}
                      </span>
                    </div>
                    <div className="option-details">
                      <span>3-5 business days</span>
                      <span className="ecopoints-bonus">🌱 +10 EcoPoints</span>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="delivery-option">
                <input
                  type="radio"
                  id="express"
                  name="delivery"
                  value="express"
                  checked={deliveryOption === 'express'}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                />
                <label htmlFor="express">
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-name">Express Delivery</span>
                      <span className="option-price">
                        {freeShippingApplied ? 'FREE (Reward Applied)' : '₹999'}
                      </span>
                    </div>
                    <div className="option-details">
                      <span>1-2 business days</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Packaging Options</h3>
            <div className="packaging-option">
              <input
                type="checkbox"
                id="ecoPackaging"
                checked={ecoPackaging}
                onChange={(e) => setEcoPackaging(e.target.checked)}
              />
              <label htmlFor="ecoPackaging">
                <div className="option-content">
                  <div className="option-header">
                    <span className="option-name">Eco-Friendly Packaging</span>
                    <span className="ecopoints-bonus">🌱 +5 EcoPoints</span>
                  </div>
                  <div className="option-details">
                    <span>Biodegradable materials, minimal waste</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="checkout-section">
            <h3>EcoPoints Redemption</h3>
            
            <div className="rewards-grid">
              <div className="reward-card">
                <h4>10% Off This Order</h4>
                <p>Get 10% off this purchase up to ₹2000</p>
                <p className="reward-cost">🌱 100 EcoPoints</p>
                <button 
                  className="redeem-btn"
                  onClick={() => handleRedeemReward({_id: 'discount10', ecoPointsCost: 100, name: '10% Off This Order'})}
                  disabled={user?.ecoPoints < 100 || discountApplied}
                >
                  {discountApplied ? 'Applied' : 'Redeem'}
                </button>
              </div>
              <div className="reward-card">
                <h4>Free Shipping</h4>
                <p>Free shipping on this order</p>
                <p className="reward-cost">🌱 50 EcoPoints</p>
                <button 
                  className="redeem-btn"
                  onClick={() => handleRedeemReward({_id: 'freeshipping', ecoPointsCost: 50, name: 'Free Shipping'})}
                  disabled={user?.ecoPoints < 50 || freeShippingApplied}
                >
                  {freeShippingApplied ? 'Applied' : 'Redeem'}
                </button>
              </div>
            </div>
          </div>

          {orderSummary && (
            <div className="checkout-section">
              <h3>Order Summary</h3>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{orderSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (18%):</span>
                  <span>₹{orderSummary.tax.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>
                    {orderSummary.shipping === 0 ? (
                      freeShippingApplied ? 'FREE (Reward Applied)' : 'FREE'
                    ) : `₹${orderSummary.shipping.toFixed(2)}`}
                  </span>
                </div>
                {discountApplied && orderSummary.discountAmount > 0 && (
                  <div className="summary-row discount">
                    <span>EcoPoints Discount:</span>
                    <span>-₹{orderSummary.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{orderSummary.finalTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row ecopoints-earned">
                  <span>EcoPoints to earn:</span>
                  <span>🌱 {orderSummary.ecoPointsEarned}</span>
                </div>
                {orderSummary.deliveryEcoPoints > 0 && (
                  <div className="summary-row ecopoints-breakdown">
                    <span>From delivery:</span>
                    <span>🌱 +{orderSummary.deliveryEcoPoints}</span>
                  </div>
                )}
                {orderSummary.packagingEcoPoints > 0 && (
                  <div className="summary-row ecopoints-breakdown">
                    <span>From packaging:</span>
                    <span>🌱 +{orderSummary.packagingEcoPoints}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="checkout-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              onClick={handleCheckout}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: 9999,
                position: 'relative',
                marginLeft: '10px'
              }}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 