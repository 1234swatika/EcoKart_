import React, { useState, useEffect } from 'react';
import config from '../config';
import './EcoPointsModal.css';

const EcoPointsModal = ({ isOpen, onClose, user, token, onRefresh }) => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');

  useEffect(() => {
    if (isOpen && user) {
      fetchEcoPointsData();
    }
  }, [isOpen, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEcoPointsData = async () => {
    setLoading(true);
    try {
      // Fetch balance
      const balanceResponse = await fetch(`
        ${config.API_BASE_URL}/api/eco-rewards/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.ecoPoints);
      }

      // Fetch history
      const historyResponse = await fetch(`
        ${config.API_BASE_URL}/api/eco-rewards/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData);
      }

      // Fetch redemptions
      const redemptionsResponse = await fetch(`
        ${config.API_BASE_URL}/api/eco-rewards/my-redemptions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (redemptionsResponse.ok) {
        const redemptionsData = await redemptionsResponse.json();
        setRedemptions(redemptionsData);
      }

      // Fetch available rewards
      const rewardsResponse = await fetch(`
        ${config.API_BASE_URL}/api/eco-rewards/rewards`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setAvailableRewards(rewardsData);
      }
    } catch (error) {
      console.error('Error fetching EcoPoints data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward) => {
    if (balance < reward.ecoPointsCost) {
      alert(`Insufficient EcoPoints. You have ${balance}, need ${reward.ecoPointsCost}`);
      return;
    }

    try {
      const response = await fetch(`
        ${config.API_BASE_URL}/api/eco-rewards/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId: reward._id }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Reward redeemed successfully! ${result.redemption.discountAmount} discount applied.`);
        fetchEcoPointsData(); // Refresh data
        if (onRefresh) onRefresh(); // Refresh parent user data
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      alert('Error redeeming reward');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ecopoints-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🌱 EcoPoints Center</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ecopoints-content">
          {/* Balance Display */}
          <div className="balance-section">
            <div className="balance-card">
              <h3>Your EcoPoints Balance</h3>
              <div className="balance-amount">🌱 {balance}</div>
              <p className="balance-description">
                Earn points by choosing eco-friendly products and redeem them for rewards!
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
            >
              Balance & History
            </button>
            <button
              className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
              onClick={() => setActiveTab('rewards')}
            >
              Available Rewards
            </button>
            <button
              className={`tab ${activeTab === 'redemptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('redemptions')}
            >
              My Redemptions
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {/* Balance & History Tab */}
                {activeTab === 'balance' && (
                  <div className="balance-history">
                    <h3>EcoPoints History</h3>
                    {history.length > 0 ? (
                      <div className="history-list">
                        {history.map((order, idx) => (
                          <div key={idx} className="history-item">
                            <div className="history-info">
                              <span className="history-date">{formatDate(order.orderDate)}</span>
                              <span className="history-amount">+{order.ecoPointsEarned} EcoPoints</span>
                            </div>
                            <span className="history-order">Order #{order._id.slice(-6)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No EcoPoints earned yet. Start shopping eco-friendly products!</p>
                    )}
                  </div>
                )}

                {/* Available Rewards Tab */}
                {activeTab === 'rewards' && (
                  <div className="rewards-section">
                    <h3>Available Rewards</h3>
                    <div className="rewards-grid">
                      {availableRewards.map((reward) => (
                        <div key={reward._id} className="reward-card">
                          <h4>{reward.name}</h4>
                          <p>{reward.description}</p>
                          <div className="reward-details">
                            <span className="reward-cost">🌱 {reward.ecoPointsCost} EcoPoints</span>
                            <span className="reward-value">
                              {reward.category === 'discount' && `${reward.discountPercentage}% off`}
                              {reward.category === 'free_shipping' && 'Free Shipping'}
                              {reward.category === 'cashback' && `$${reward.maxDiscount} cashback`}
                              {reward.category === 'donation' && 'Plant a Tree'}
                            </span>
                          </div>
                          <button
                            className="redeem-btn"
                            onClick={() => handleRedeemReward(reward)}
                            disabled={balance < reward.ecoPointsCost}
                          >
                            {balance < reward.ecoPointsCost ? 'Insufficient Points' : 'Redeem'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Redemptions Tab */}
                {activeTab === 'redemptions' && (
                  <div className="redemptions-section">
                    <h3>My Redemptions</h3>
                    {redemptions.length > 0 ? (
                      <div className="redemptions-list">
                        {redemptions.map((redemption) => (
                          <div key={redemption._id} className="redemption-item">
                            <div className="redemption-info">
                              <h4>{redemption.rewardId?.name || 'Reward'}</h4>
                              <span className="redemption-date">
                                Redeemed: {formatDate(redemption.redeemedAt)}
                              </span>
                              <span className="redemption-status">Status: {redemption.status}</span>
                            </div>
                            <div className="redemption-details">
                              <span className="points-spent">-{redemption.ecoPointsSpent} EcoPoints</span>
                              <span className="discount-value">${redemption.discountAmount} value</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No redemptions yet. Check out available rewards!</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoPointsModal;
