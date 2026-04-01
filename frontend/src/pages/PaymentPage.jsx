import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './PaymentPage.css';

function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [useCredits, setUseCredits] = useState(false);
  const [rewardPointsToUse, setRewardPointsToUse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!paymentCompleted && booking && booking.status === 'pending') {
        e.preventDefault();
        e.returnValue = 'You have an unpaid booking. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [booking, paymentCompleted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingResponse, walletData] = await Promise.all([
        api.booking.getBooking(bookingId),
        api.wallet.getWallet()
      ]);
      
      const bookingData = bookingResponse.data || bookingResponse;
      setBooking(bookingData);
      setWallet(walletData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentBreakdown = () => {
    if (!booking || !wallet) return null;

    const totalAmount = parseFloat(booking.ride?.pricePerSeat || 0);
    
    if (totalAmount === 0) {
      return {
        error: 'This ride has no price set. Please contact the driver.',
        totalAmount: 0,
        pointsUsed: 0,
        pointsDiscount: 0,
        creditsUsed: 0,
        creditsDiscount: 0,
        remainingAmount: 0,
        cashbackEarned: 0,
        rewardPointsEarned: 0
      };
    }

    let remainingAmount = totalAmount;
    let creditsUsed = 0;
    let pointsUsed = 0;
    let pointsDiscount = 0;
    let creditsDiscount = 0;

    if (rewardPointsToUse > 0) {
      pointsUsed = Math.min(rewardPointsToUse, wallet.rewardPoints);
      pointsDiscount = pointsUsed * 0.01;
      remainingAmount = Math.max(0, remainingAmount - pointsDiscount);
    }

    if (useCredits && wallet.credits > 0) {
      const creditsNeeded = Math.ceil(remainingAmount / 0.10);
      creditsUsed = Math.min(creditsNeeded, wallet.credits);
      creditsDiscount = creditsUsed * 0.10;
      remainingAmount = Math.max(0, remainingAmount - creditsDiscount);
    }

    const cashbackEarned = totalAmount * 0.05;
    const rewardPointsEarned = Math.floor(totalAmount * 10);

    return {
      totalAmount,
      pointsUsed,
      pointsDiscount,
      creditsUsed,
      creditsDiscount,
      remainingAmount,
      cashbackEarned,
      rewardPointsEarned
    };
  };

  const handlePayment = async () => {
    const breakdown = calculatePaymentBreakdown();

    if (breakdown.error) {
      alert(breakdown.error);
      return;
    }

    if (breakdown.remainingAmount > wallet.balance) {
      alert('Insufficient wallet balance. Please add funds first.');
      navigate('/wallet');
      return;
    }

    setProcessing(true);
    try {
      await api.payment.processPayment({
        bookingId,
        useCredits,
        useRewardPoints: rewardPointsToUse
      });

      setPaymentCompleted(true);
      alert('Payment successful! Funds are held in escrow until ride completion.');
      navigate('/my-rides');
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (booking && booking.status === 'pending') {
      try {
        await api.booking.cancelPendingBooking(bookingId);
        alert('Booking cancelled successfully');
        navigate('/rides');
      } catch (error) {
        console.error('Failed to cancel booking:', error);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-loading">
          <div className="loading-spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-error">
          <div className="error-icon">⚠️</div>
          <h2>Booking Not Found</h2>
          <button onClick={() => navigate('/rides')} className="btn-back">
            Return to Rides
          </button>
        </div>
      </div>
    );
  }

  const breakdown = calculatePaymentBreakdown();
  const insufficientBalance = breakdown.remainingAmount > wallet.balance;

  return (
    <div className="payment-page">
      <Navbar />
      
      <div className="payment-hero">
        <div className="hero-gradient"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Secure Payment
          </div>
          <h1 className="hero-title">Complete Your Booking</h1>
          <p className="hero-subtitle">Your payment is protected by our escrow system</p>
        </div>
      </div>

      <div className="payment-container">
        <div className="payment-grid">
          
          {/* Left Column - Main Content */}
          <div className="payment-main">
            
            {/* Ride Details Card */}
            <div className="card ride-card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
                  </svg>
                </div>
                <h2 className="card-title">Trip Details</h2>
              </div>
              
              <div className="ride-route">
                <div className="route-point">
                  <div className="route-marker start">
                    <div className="marker-dot"></div>
                  </div>
                  <div className="route-info">
                    <span className="route-label">From</span>
                    <span className="route-location">{booking.ride?.source}</span>
                  </div>
                </div>
                
                <div className="route-line"></div>
                
                <div className="route-point">
                  <div className="route-marker end">
                    <div className="marker-dot"></div>
                  </div>
                  <div className="route-info">
                    <span className="route-label">To</span>
                    <span className="route-location">{booking.ride?.destination}</span>
                  </div>
                </div>
              </div>

              <div className="ride-meta">
                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{new Date(booking.ride?.departureTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>1 Seat</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="card wallet-card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <h2 className="card-title">Wallet Balance</h2>
                <button 
                  className="btn-link"
                  onClick={() => navigate('/wallet')}
                >
                  Add Funds
                </button>
              </div>
              
              <div className="wallet-grid">
                <div className="wallet-item primary">
                  <div className="wallet-icon">💰</div>
                  <div className="wallet-details">
                    <span className="wallet-label">Available Balance</span>
                    <span className="wallet-value">${wallet.balance.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="wallet-item">
                  <div className="wallet-icon">🎫</div>
                  <div className="wallet-details">
                    <span className="wallet-label">Ride Credits</span>
                    <span className="wallet-value">
                      {wallet.credits}
                      <span className="wallet-subvalue">≈ ${(wallet.credits * 0.10).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
                
                <div className="wallet-item">
                  <div className="wallet-icon">⭐</div>
                  <div className="wallet-details">
                    <span className="wallet-label">Reward Points</span>
                    <span className="wallet-value">
                      {wallet.rewardPoints}
                      <span className="wallet-subvalue">≈ ${(wallet.rewardPoints * 0.01).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options Card */}
            <div className="card options-card">
              <div className="card-header">
                <div className="card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h2 className="card-title">Payment Options</h2>
              </div>

              <div className="options-list">
                {/* Credits Toggle */}
                <div className={`option-item ${useCredits ? 'active' : ''} ${wallet.credits === 0 ? 'disabled' : ''}`}>
                  <label className="option-label">
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                      disabled={wallet.credits === 0}
                      className="option-checkbox"
                    />
                    <div className="option-content">
                      <div className="option-header">
                        <span className="option-icon">🎫</span>
                        <div className="option-text">
                          <span className="option-name">Use Ride Credits</span>
                          <span className="option-description">
                            {wallet.credits > 0 
                              ? `${wallet.credits} credits available` 
                              : 'No credits available'}
                          </span>
                        </div>
                      </div>
                      {useCredits && breakdown.creditsUsed > 0 && (
                        <div className="option-savings">
                          Save ${breakdown.creditsDiscount.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="option-check">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </label>
                </div>

                {/* Reward Points Input */}
                <div className={`option-item ${rewardPointsToUse > 0 ? 'active' : ''} ${wallet.rewardPoints === 0 ? 'disabled' : ''}`}>
                  <div className="option-content full">
                    <div className="option-header">
                      <span className="option-icon">⭐</span>
                      <div className="option-text">
                        <span className="option-name">Reward Points</span>
                        <span className="option-description">
                          {wallet.rewardPoints > 0 
                            ? `${wallet.rewardPoints} points available (${(wallet.rewardPoints * 0.01).toFixed(2)} value)` 
                            : 'No points available'}
                        </span>
                      </div>
                    </div>
                    
                    {wallet.rewardPoints > 0 && (
                      <div className="option-input-group">
                        <input
                          type="range"
                          min="0"
                          max={wallet.rewardPoints}
                          value={rewardPointsToUse}
                          onChange={(e) => setRewardPointsToUse(parseInt(e.target.value))}
                          className="points-slider"
                        />
                        <div className="input-row">
                          <input
                            type="number"
                            min="0"
                            max={wallet.rewardPoints}
                            value={rewardPointsToUse}
                            onChange={(e) => setRewardPointsToUse(Math.min(wallet.rewardPoints, parseInt(e.target.value) || 0))}
                            className="points-input"
                            placeholder="0"
                          />
                          <span className="input-label">points</span>
                          {rewardPointsToUse > 0 && (
                            <span className="input-value">
                              -${breakdown.pointsDiscount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="payment-sidebar">
            <div className="sidebar-sticky">
              
              {/* Payment Summary Card */}
              <div className="card summary-card">
                <div className="card-header">
                  <h2 className="card-title">Payment Summary</h2>
                  <button 
                    className="btn-toggle"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ transform: showBreakdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>

                <div className="summary-amount">
                  <span className="amount-label">Total Amount</span>
                  <span className="amount-value">${breakdown.totalAmount.toFixed(2)}</span>
                </div>

                {showBreakdown && (
                  <div className="summary-breakdown">
                    <div className="breakdown-list">
                      <div className="breakdown-row">
                        <span className="breakdown-label">Ride Cost</span>
                        <span className="breakdown-value">${breakdown.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {breakdown.pointsUsed > 0 && (
                        <div className="breakdown-row discount">
                          <span className="breakdown-label">
                            <span className="discount-badge">Discount</span>
                            Reward Points ({breakdown.pointsUsed})
                          </span>
                          <span className="breakdown-value">-${breakdown.pointsDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {breakdown.creditsUsed > 0 && (
                        <div className="breakdown-row discount">
                          <span className="breakdown-label">
                            <span className="discount-badge">Discount</span>
                            Ride Credits ({breakdown.creditsUsed})
                          </span>
                          <span className="breakdown-value">-${breakdown.creditsDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="breakdown-divider"></div>

                    <div className="breakdown-total">
                      <span className="total-label">Amount to Pay</span>
                      <span className="total-value">${breakdown.remainingAmount.toFixed(2)}</span>
                    </div>

                    {/* Rewards Preview */}
                    <div className="rewards-preview">
                      <div className="rewards-header">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        <span>You'll Earn</span>
                      </div>
                      <div className="rewards-list">
                        <div className="reward-item">
                          <span className="reward-icon">💝</span>
                          <span className="reward-text">
                            ${breakdown.cashbackEarned.toFixed(2)} Cashback
                          </span>
                        </div>
                        <div className="reward-item">
                          <span className="reward-icon">⭐</span>
                          <span className="reward-text">
                            {breakdown.rewardPointsEarned} Points
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insufficient Balance Warning */}
                {insufficientBalance && (
                  <div className="alert alert-warning">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div className="alert-content">
                      <span className="alert-title">Insufficient Balance</span>
                      <span className="alert-message">
                        You need ${(breakdown.remainingAmount - wallet.balance).toFixed(2)} more
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="summary-actions">
                  <button
                    className={`btn-pay ${processing ? 'processing' : ''} ${insufficientBalance ? 'disabled' : ''}`}
                    onClick={handlePayment}
                    disabled={processing || insufficientBalance}
                  >
                    {processing ? (
                      <>
                        <div className="btn-spinner"></div>
                        <span>Processing...</span>
                      </>
                    ) : insufficientBalance ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        <span>Add Funds to Continue</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                        <span>Confirm Payment ${breakdown.remainingAmount.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                  
                  <button 
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={processing}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>

              {/* Security Info Card */}
              <div className="card security-card">
                <div className="security-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Secure Payment</span>
                </div>
                <div className="security-features">
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Escrow protected</span>
                  </div>
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Encrypted transaction</span>
                  </div>
                  <div className="feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Instant refund on cancellation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
