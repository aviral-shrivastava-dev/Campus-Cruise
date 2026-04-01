import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './WalletPage.css';

function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Add inline styles to override any CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .wallet-page .wallet-hero .hero-content h1.hero-title {
        color: #ffffff !important;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
      }
      .wallet-page .wallet-hero .hero-content p.hero-subtitle {
        color: #ffffff !important;
      }
      .wallet-page .balance-card.primary-card .card-label,
      .wallet-page .balance-card.primary-card h2.card-value,
      .wallet-page .balance-card.primary-card p.card-subtext {
        color: #ffffff !important;
      }
      .wallet-page .balance-card .card-label {
        color: #4b5563 !important;
      }
      .wallet-page .balance-card h2.card-value {
        color: #111827 !important;
      }
      .wallet-page .balance-card p.card-subtext {
        color: #6b7280 !important;
      }
      .wallet-page .section-title {
        color: #111827 !important;
      }
      .wallet-page .txn-description {
        color: #111827 !important;
      }
      .wallet-page .txn-date {
        color: #6b7280 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, txnData] = await Promise.all([
        api.wallet.getWallet(),
        api.wallet.getTransactions()
      ]);
      setWallet(walletData);
      setTransactions(txnData.transactions);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      showNotification('Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addFundsAmount);
    if (amount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }

    try {
      setProcessing(true);
      await api.wallet.addFunds(amount, 'Wallet top-up');
      showNotification(`Successfully added $${amount.toFixed(2)} to your wallet!`, 'success');
      setAddFundsAmount('');
      setShowAddFundsModal(false);
      fetchWalletData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to add funds', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchaseCredits = async (e) => {
    e.preventDefault();
    const credits = parseInt(creditAmount);
    if (credits <= 0) {
      showNotification('Please enter a valid credit amount', 'error');
      return;
    }

    const cost = credits * 0.10;
    if (wallet.balance < cost) {
      showNotification('Insufficient balance. Please add funds first.', 'error');
      return;
    }

    try {
      setProcessing(true);
      await api.wallet.purchaseCredits(credits);
      showNotification(`Successfully purchased ${credits} credits!`, 'success');
      setCreditAmount('');
      setShowCreditsModal(false);
      fetchWalletData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to purchase credits', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRedeemPoints = async (e) => {
    e.preventDefault();
    const points = parseInt(redeemPoints);
    if (points <= 0) {
      showNotification('Please enter a valid points amount', 'error');
      return;
    }

    if (wallet.rewardPoints < points) {
      showNotification('Insufficient reward points', 'error');
      return;
    }

    try {
      setProcessing(true);
      await api.wallet.redeemPoints(points);
      const cashValue = (points * 0.01).toFixed(2);
      showNotification(`Successfully redeemed ${points} points for $${cashValue}!`, 'success');
      setRedeemPoints('');
      setShowRewardsModal(false);
      fetchWalletData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to redeem points', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      withdrawal: '💸',
      ride_payment: '🚗',
      ride_earning: '💵',
      refund: '↩️',
      credit_purchase: '🎫',
      credit_usage: '🎟️',
      reward_redemption: '🎁',
      cashback: '💝',
      split_payment: '🤝',
      escrow_hold: '🔒',
      escrow_release: '🔓'
    };
    return icons[type] || '💳';
  };

  const getTransactionColor = (type) => {
    const colors = {
      deposit: '#10b981',
      withdrawal: '#ef4444',
      ride_payment: '#f59e0b',
      ride_earning: '#10b981',
      refund: '#3b82f6',
      credit_purchase: '#8b5cf6',
      credit_usage: '#ec4899',
      reward_redemption: '#f59e0b',
      cashback: '#10b981',
      split_payment: '#6366f1',
      escrow_hold: '#64748b',
      escrow_release: '#10b981'
    };
    return colors[type] || '#6b7280';
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesFilter = filterType === 'all' || txn.type === filterType;
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const transactionTypes = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'ride_payment', label: 'Ride Payments' },
    { value: 'ride_earning', label: 'Earnings' },
    { value: 'credit_purchase', label: 'Credit Purchases' },
    { value: 'reward_redemption', label: 'Rewards' }
  ];

  if (loading) {
    return (
      <div className="wallet-page">
        <Navbar />
        <div className="wallet-loading">
          <div className="loading-spinner"></div>
          <p>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <Navbar />
      
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`notification-toast ${notification.type}`}
          >
            <span className="notification-icon">
              {notification.type === 'success' ? '✓' : '⚠'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="wallet-hero" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="hero-title" style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}>Your Wallet</h1>
            <p className="hero-subtitle" style={{ color: '#ffffff' }}>Manage your funds, credits, and rewards all in one place</p>
          </motion.div>
        </div>
        <div className="hero-gradient"></div>
      </div>

      {/* Balance Cards */}
      <div className="wallet-container">
        <motion.div
          className="balance-cards-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Main Balance Card */}
          <div className="balance-card primary-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-header">
              <div className="card-icon-wrapper primary">
                <svg className="card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="card-label" style={{ color: '#ffffff' }}>Wallet Balance</span>
            </div>
            <div className="card-value-section">
              <h2 className="card-value" style={{ color: '#ffffff' }}>${wallet?.balance?.toFixed(2) || '0.00'}</h2>
              <button 
                className="card-action-btn"
                onClick={() => setShowAddFundsModal(true)}
                style={{ background: '#ffffff', color: '#667eea' }}
              >
                <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Funds
              </button>
            </div>
          </div>

          {/* Credits Card */}
          <div className="balance-card secondary-card">
            <div className="card-header">
              <div className="card-icon-wrapper secondary">
                <svg className="card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <span className="card-label" style={{ color: '#4b5563' }}>Ride Credits</span>
            </div>
            <div className="card-value-section">
              <h2 className="card-value" style={{ color: '#111827' }}>{wallet?.credits || 0}</h2>
              <p className="card-subtext" style={{ color: '#6b7280' }}>${((wallet?.credits || 0) * 0.10).toFixed(2)} value</p>
              <button 
                className="card-action-btn secondary"
                onClick={() => setShowCreditsModal(true)}
              >
                Buy Credits
              </button>
            </div>
          </div>

          {/* Rewards Card */}
          <div className="balance-card tertiary-card">
            <div className="card-header">
              <div className="card-icon-wrapper tertiary">
                <svg className="card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="card-label" style={{ color: '#4b5563' }}>Reward Points</span>
            </div>
            <div className="card-value-section">
              <h2 className="card-value" style={{ color: '#111827' }}>{wallet?.rewardPoints || 0}</h2>
              <p className="card-subtext" style={{ color: '#6b7280' }}>${((wallet?.rewardPoints || 0) * 0.01).toFixed(2)} value</p>
              <button 
                className="card-action-btn tertiary"
                onClick={() => setShowRewardsModal(true)}
                disabled={!wallet?.rewardPoints}
              >
                Redeem
              </button>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="balance-card quaternary-card">
            <div className="card-header">
              <div className="card-icon-wrapper quaternary">
                <svg className="card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="card-label" style={{ color: '#4b5563' }}>Total Earnings</span>
            </div>
            <div className="card-value-section">
              <h2 className="card-value" style={{ color: '#111827' }}>${wallet?.totalEarnings?.toFixed(2) || '0.00'}</h2>
              <p className="card-subtext" style={{ color: '#6b7280' }}>Lifetime earnings</p>
            </div>
          </div>
        </motion.div>

        {/* Transactions Section */}
        <motion.div
          className="transactions-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title" style={{ color: '#111827' }}>Transaction History</h2>
            <div className="section-actions">
              <div className="search-box">
                <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                {transactionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="empty-title">No transactions found</h3>
              <p className="empty-description">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <div className="transactions-list">
              <AnimatePresence>
                {filteredTransactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="transaction-item"
                  >
                    <div 
                      className="txn-icon-wrapper"
                      style={{ backgroundColor: `${getTransactionColor(txn.type)}20` }}
                    >
                      <span 
                        className="txn-icon"
                        style={{ color: getTransactionColor(txn.type) }}
                      >
                        {getTransactionIcon(txn.type)}
                      </span>
                    </div>
                    
                    <div className="txn-details">
                      <h4 className="txn-description" style={{ color: '#111827' }}>{txn.description}</h4>
                      <div className="txn-meta">
                        <span className="txn-date" style={{ color: '#6b7280' }}>
                          {new Date(txn.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {txn.credits !== 0 && (
                          <span className="txn-badge credits">
                            {txn.credits > 0 ? '+' : ''}{txn.credits} credits
                          </span>
                        )}
                        {txn.rewardPoints !== 0 && (
                          <span className="txn-badge points">
                            {txn.rewardPoints > 0 ? '+' : ''}{txn.rewardPoints} pts
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`txn-amount ${txn.amount >= 0 ? 'positive' : 'negative'}`}>
                      <span className="amount-value">
                        {txn.amount >= 0 ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFundsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !processing && setShowAddFundsModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Add Funds</h3>
                <button
                  className="modal-close"
                  onClick={() => !processing && setShowAddFundsModal(false)}
                  disabled={processing}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddFunds} className="modal-form">
                <p className="modal-description">
                  Add money to your wallet for seamless ride payments and purchases
                </p>
                
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={addFundsAmount}
                      onChange={(e) => setAddFundsAmount(e.target.value)}
                      placeholder="0.00"
                      className="form-input"
                      required
                      disabled={processing}
                    />
                  </div>
                </div>
                
                <div className="quick-amounts">
                  {[10, 25, 50, 100, 200].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className={`quick-amount-btn ${addFundsAmount === amount.toString() ? 'active' : ''}`}
                      onClick={() => setAddFundsAmount(amount.toString())}
                      disabled={processing}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddFundsModal(false)}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={processing || !addFundsAmount}
                  >
                    {processing ? (
                      <>
                        <span className="btn-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      'Add Funds'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Credits Modal */}
      <AnimatePresence>
        {showCreditsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !processing && setShowCreditsModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Purchase Ride Credits</h3>
                <button
                  className="modal-close"
                  onClick={() => !processing && setShowCreditsModal(false)}
                  disabled={processing}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handlePurchaseCredits} className="modal-form">
                <div className="info-banner">
                  <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="info-text">1 credit = $0.10</p>
                    <p className="info-subtext">Use credits for discounted rides and special offers</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Number of Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="form-input"
                    required
                    disabled={processing}
                  />
                  {creditAmount && (
                    <div className="cost-preview">
                      <span>Total Cost:</span>
                      <span className="cost-value">${(parseInt(creditAmount) * 0.10).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="quick-amounts">
                  {[50, 100, 200, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className={`quick-amount-btn ${creditAmount === amount.toString() ? 'active' : ''}`}
                      onClick={() => setCreditAmount(amount.toString())}
                      disabled={processing}
                    >
                      {amount} credits
                      <span className="quick-amount-price">${(amount * 0.10).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
                
                <div className="balance-info">
                  <span>Your Balance:</span>
                  <span className="balance-value">${wallet?.balance?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreditsModal(false)}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={processing || !creditAmount}
                  >
                    {processing ? (
                      <>
                        <span className="btn-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      'Purchase Credits'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Rewards Modal */}
      <AnimatePresence>
        {showRewardsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !processing && setShowRewardsModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Redeem Reward Points</h3>
                <button
                  className="modal-close"
                  onClick={() => !processing && setShowRewardsModal(false)}
                  disabled={processing}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRedeemPoints} className="modal-form">
                <div className="rewards-summary">
                  <div className="reward-stat-card">
                    <span className="stat-label">Available Points</span>
                    <span className="stat-value">{wallet?.rewardPoints || 0}</span>
                  </div>
                  <div className="reward-stat-card">
                    <span className="stat-label">Cash Value</span>
                    <span className="stat-value">${((wallet?.rewardPoints || 0) * 0.01).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="info-banner success">
                  <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <div>
                    <p className="info-text">Earn 10 points per dollar spent</p>
                    <p className="info-subtext">1 point = $0.01 • 5% cashback on every ride</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Points to Redeem</label>
                  <input
                    type="number"
                    min="1"
                    max={wallet?.rewardPoints || 0}
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    placeholder="Enter points"
                    className="form-input"
                    required
                    disabled={processing}
                  />
                  {redeemPoints && (
                    <div className="cost-preview success">
                      <span>You'll receive:</span>
                      <span className="cost-value">${(parseInt(redeemPoints) * 0.01).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="quick-amounts">
                  {[100, 250, 500, 1000].map(amount => (
                    wallet?.rewardPoints >= amount && (
                      <button
                        key={amount}
                        type="button"
                        className={`quick-amount-btn ${redeemPoints === amount.toString() ? 'active' : ''}`}
                        onClick={() => setRedeemPoints(amount.toString())}
                        disabled={processing}
                      >
                        {amount} points
                        <span className="quick-amount-price">${(amount * 0.01).toFixed(2)}</span>
                      </button>
                    )
                  ))}
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowRewardsModal(false)}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={processing || !redeemPoints || !wallet?.rewardPoints}
                  >
                    {processing ? (
                      <>
                        <span className="btn-spinner"></span>
                        Processing...
                      </>
                    ) : (
                      'Redeem Points'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletPage;
