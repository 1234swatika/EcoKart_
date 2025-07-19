import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import config from '../config';
import './Home.css';

const Home = ({ user }) => {
  const [userStats, setUserStats] = useState({
    ecoFriendlyChoices: 0,
    planetImpact: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available for fetching user stats');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const orders = await response.json();
        
        // Calculate eco-friendly choices and planet impact
        let ecoFriendlyChoices = 0;
        let planetImpact = 0;
        
        orders.forEach(order => {
          order.items.forEach(item => {
            if (item.isEcoAlternative) {
              ecoFriendlyChoices += item.quantity;
              planetImpact += item.quantity * 10; // 10 kg CO2 saved per eco-friendly purchase
            }
          });
        });
        
        setUserStats({
          ecoFriendlyChoices,
          planetImpact
        });
      } else {
        console.error('Failed to fetch orders:', response.status);
        // Set default values if API fails
        setUserStats({
          ecoFriendlyChoices: 0,
          planetImpact: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set default values if there's an error (e.g., backend not running)
      setUserStats({
        ecoFriendlyChoices: 0,
        planetImpact: 0
      });
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to EcoKart 🌱</h1>
          {user ? (
            <div className="user-welcome">
              <p className="hero-subtitle">Welcome back, {user.name}! 🌱</p>
              <div className="user-ecopoints-display">
                <span className="ecopoints-large">🌱 {user.ecoPoints || 0} EcoPoints</span>
              </div>
            </div>
          ) : (
            <p className="hero-subtitle">Your Sustainable Shopping Destination</p>
          )}
          <p className="hero-description">
            Discover eco-friendly alternatives to your favorite products and earn EcoPoints 
            while making a positive impact on the environment.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="cta-button primary">
              Start Shopping
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="eco-illustration">
            🌿🌍♻️
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How EcoKart Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Browse Categories</h3>
            <p>Explore our wide range of product categories and find eco-friendly alternatives.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Compare Products</h3>
            <p>See the difference between regular products and their sustainable alternatives.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Earn EcoPoints</h3>
            <p>Get EcoPoints for every eco-friendly product you purchase.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Redeem Rewards</h3>
            <p>Use your EcoPoints for discounts, free shipping, and exclusive offers.</p>
          </div>
        </div>
      </section>

      {/* User Stats */}
      {user && (
        <section className="user-stats">
          <h2>Your Eco Impact</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">🌱 {user.ecoPoints || 0}</div>
              <div className="stat-label">EcoPoints Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">♻️ {userStats.ecoFriendlyChoices}</div>
              <div className="stat-label">Eco-Friendly Choices</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">🌍 {userStats.planetImpact}</div>
              <div className="stat-label">Planet Impact</div>
              <div className="impact-description">
                {userStats.planetImpact} kilograms of carbon footprints saved
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>Join thousands of eco-conscious shoppers who are already making sustainable choices.</p>
      </section>
    </div>
  );
};

export default Home; 