import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="url(#gradient)" />
                  <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="logo-text">Campus Cruise</span>
            </div>
            <div className="nav-links">
              <Link to="/features" className="nav-link">Features</Link>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/login" className="nav-link-btn secondary">Sign In</Link>
              <Link to="/signup" className="nav-link-btn primary">
                Get Started
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            <button className="mobile-menu-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="hero-grid-pattern"></div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Trusted by 10,000+ students across 50+ campuses</span>
            </div>
            
            <h1 className="hero-title">
              The Future of
              <span className="title-highlight"> Campus Travel</span>
              <br />
              Starts Here
            </h1>
            
            <p className="hero-subtitle">
              Connect with verified students, share rides instantly, and save up to 70% on travel costs.
              The smartest way to get around campus and beyond.
            </p>
            
            <div className="hero-cta">
              <Link to="/signup" className="btn-hero primary">
                <span>Start Free Today</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 3l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <button className="btn-hero secondary">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="hero-social-proof">
              <div className="avatar-stack">
                <div className="avatar">👨‍🎓</div>
                <div className="avatar">👩‍🎓</div>
                <div className="avatar">👨‍💼</div>
                <div className="avatar">👩‍💻</div>
                <div className="avatar-count">+10K</div>
              </div>
              <div className="social-proof-text">
                <div className="rating-stars">★★★★★</div>
                <p>4.9/5 from 2,500+ reviews</p>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="mockup-title">Campus Cruise Dashboard</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-card card-1">
                  <div className="card-icon">🚗</div>
                  <div className="card-info">
                    <h4>Next Ride</h4>
                    <p>Today at 3:00 PM</p>
                  </div>
                  <div className="card-status">Confirmed</div>
                </div>
                <div className="mockup-card card-2">
                  <div className="card-icon">💰</div>
                  <div className="card-info">
                    <h4>Total Saved</h4>
                    <p className="amount">$847</p>
                  </div>
                  <div className="card-trend">↑ 23%</div>
                </div>
                <div className="mockup-card card-3">
                  <div className="card-icon">⭐</div>
                  <div className="card-info">
                    <h4>Your Rating</h4>
                    <p>4.9 / 5.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Rides Completed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">$2M+</div>
              <div className="stat-label">Money Saved</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Partner Campuses</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">Features</div>
            <h2 className="section-title">Everything you need for seamless campus travel</h2>
            <p className="section-subtitle">
              Powerful features designed specifically for college students. Safe, smart, and sustainable.
            </p>
          </div>

          <div className="features-showcase">
            <div className="feature-large">
              <div className="feature-visual">
                <div className="visual-card">
                  <div className="visual-header">
                    <div className="visual-icon">🎓</div>
                    <div className="visual-badge">Verified</div>
                  </div>
                  <div className="visual-content">
                    <div className="verification-check">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.2"/>
                        <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Campus Email Verified</span>
                    </div>
                    <div className="verification-check">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.2"/>
                        <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Student ID Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Campus-Verified Community</h3>
                <p>Only verified students from your college. Multi-layer verification ensures a safe, trusted community you can rely on.</p>
                <ul className="feature-list">
                  <li>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Institutional email verification</span>
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Student ID validation</span>
                  </li>
                  <li>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Background checks for drivers</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad1)"/>
                    <path d="M16 10v12m-6-6h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#6366f1"/>
                        <stop offset="100%" stopColor="#8b5cf6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>Smart Route Matching</h4>
                <p>AI-powered algorithm finds the best rides going your way in seconds.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad2)"/>
                    <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2"/>
                    <path d="M16 10v2m0 8v2m6-6h-2m-8 0h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#10b981"/>
                        <stop offset="100%" stopColor="#059669"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>Real-Time Tracking</h4>
                <p>Live GPS tracking keeps everyone informed and safe throughout the journey.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad3)"/>
                    <path d="M10 16l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="grad3" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#f59e0b"/>
                        <stop offset="100%" stopColor="#d97706"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>Instant Payments</h4>
                <p>Split costs automatically with secure in-app payments. No cash needed.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad4)"/>
                    <path d="M12 16h8m-8-4h8m-8 8h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="grad4" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#ec4899"/>
                        <stop offset="100%" stopColor="#db2777"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>In-App Messaging</h4>
                <p>Coordinate seamlessly with real-time chat and notifications.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad5)"/>
                    <path d="M16 12l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="grad5" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#3b82f6"/>
                        <stop offset="100%" stopColor="#2563eb"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>Rating System</h4>
                <p>Build trust with verified reviews and transparent driver ratings.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#grad6)"/>
                    <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2"/>
                    <path d="M16 12v4l3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="grad6" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#8b5cf6"/>
                        <stop offset="100%" stopColor="#7c3aed"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h4>Flexible Scheduling</h4>
                <p>Book rides instantly or schedule in advance. Your schedule, your way.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">How It Works</div>
            <h2 className="section-title">Get started in minutes</h2>
            <p className="section-subtitle">
              Three simple steps to start saving money and making connections
            </p>
          </div>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-visual">
                <div className="step-number">01</div>
                <div className="step-illustration">
                  <div className="illustration-card">
                    <div className="form-mockup">
                      <div className="form-field"></div>
                      <div className="form-field short"></div>
                      <div className="form-button"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="step-content">
                <h3>Create Your Account</h3>
                <p>Sign up with your college email and verify your student status in under 2 minutes. It's completely free.</p>
                <div className="step-features">
                  <span className="step-tag">✓ Email verification</span>
                  <span className="step-tag">✓ Student ID check</span>
                  <span className="step-tag">✓ Profile setup</span>
                </div>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-visual">
                <div className="step-number">02</div>
                <div className="step-illustration">
                  <div className="illustration-card">
                    <div className="search-mockup">
                      <div className="search-bar"></div>
                      <div className="search-result"></div>
                      <div className="search-result"></div>
                      <div className="search-result"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="step-content">
                <h3>Find or Offer Rides</h3>
                <p>Search for rides going your way or post your own trip. Our smart matching connects you instantly.</p>
                <div className="step-features">
                  <span className="step-tag">✓ Smart matching</span>
                  <span className="step-tag">✓ Filter preferences</span>
                  <span className="step-tag">✓ Instant booking</span>
                </div>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-visual">
                <div className="step-number">03</div>
                <div className="step-illustration">
                  <div className="illustration-card">
                    <div className="ride-mockup">
                      <div className="ride-status">
                        <div className="status-icon">✓</div>
                        <div className="status-text">Ride Confirmed</div>
                      </div>
                      <div className="ride-details"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="step-content">
                <h3>Ride & Save Money</h3>
                <p>Connect with your ride, track in real-time, and split costs automatically. Safe, simple, and sustainable.</p>
                <div className="step-features">
                  <span className="step-tag">✓ Live tracking</span>
                  <span className="step-tag">✓ Auto payments</span>
                  <span className="step-tag">✓ Rate & review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Tabs */}
      <section className="use-cases-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">Use Cases</div>
            <h2 className="section-title">Perfect for every journey</h2>
          </div>

          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <span className="tab-icon">🎓</span>
                <span>Students</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
                onClick={() => setActiveTab('drivers')}
              >
                <span className="tab-icon">🚗</span>
                <span>Drivers</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'commuters' ? 'active' : ''}`}
                onClick={() => setActiveTab('commuters')}
              >
                <span className="tab-icon">🏢</span>
                <span>Daily Commuters</span>
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === 'students' && (
                <div className="tab-panel">
                  <div className="tab-visual">
                    <div className="visual-mockup">
                      <div className="mockup-stat">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                          <div className="stat-value">$847</div>
                          <div className="stat-desc">Saved this semester</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-info">
                    <h3>Save Money on Every Trip</h3>
                    <p>Whether it's getting to class, heading home for the weekend, or going to that concert downtown, Campus Cruise helps you save up to 70% on travel costs.</p>
                    <ul className="benefit-list">
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Weekend trips home</strong>
                          <p>Find rides to your hometown and split gas costs</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Campus commutes</strong>
                          <p>Daily rides between campus locations</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Events & activities</strong>
                          <p>Group rides to concerts, games, and parties</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'drivers' && (
                <div className="tab-panel">
                  <div className="tab-visual">
                    <div className="visual-mockup">
                      <div className="mockup-stat">
                        <div className="stat-icon">💵</div>
                        <div className="stat-info">
                          <div className="stat-value">$420</div>
                          <div className="stat-desc">Earned this month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-info">
                    <h3>Offset Your Driving Costs</h3>
                    <p>Already making the trip? Share your empty seats and earn money while helping fellow students. It's a win-win for everyone.</p>
                    <ul className="benefit-list">
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Earn extra income</strong>
                          <p>Cover gas, maintenance, and more</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Flexible schedule</strong>
                          <p>Drive when it works for you</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Meet new people</strong>
                          <p>Build connections across campus</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'commuters' && (
                <div className="tab-panel">
                  <div className="tab-visual">
                    <div className="visual-mockup">
                      <div className="mockup-stat">
                        <div className="stat-icon">🌱</div>
                        <div className="stat-info">
                          <div className="stat-value">240kg</div>
                          <div className="stat-desc">CO₂ saved</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tab-info">
                    <h3>Make Your Daily Commute Better</h3>
                    <p>Turn your daily drive into a social experience while reducing your carbon footprint and saving money on parking and gas.</p>
                    <ul className="benefit-list">
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Regular carpool groups</strong>
                          <p>Find consistent ride partners</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Parking savings</strong>
                          <p>Share parking costs and spots</p>
                        </div>
                      </li>
                      <li>
                        <div className="benefit-icon">✓</div>
                        <div>
                          <strong>Environmental impact</strong>
                          <p>Reduce emissions and traffic</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">Testimonials</div>
            <h2 className="section-title">Loved by students everywhere</h2>
            <p className="section-subtitle">
              Join thousands of students who are already saving money and making connections
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card featured">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236366f1'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3ESM%3C/text%3E%3C/svg%3E" alt="Sarah M." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Sarah Martinez</div>
                  <div className="author-meta">
                    <span className="author-school">UCLA</span>
                    <span className="author-verified">✓ Verified Student</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"Campus Cruise has been a game-changer for me. I've saved over $500 this semester on rides home, and I've met some amazing people along the way. The verification process makes me feel safe, and the app is super easy to use."</p>
              </div>
              <div className="testimonial-footer">
                <span className="testimonial-stat">
                  <strong>47</strong> rides taken
                </span>
                <span className="testimonial-stat">
                  <strong>$523</strong> saved
                </span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3EMT%3C/text%3E%3C/svg%3E" alt="Mike T." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Mike Thompson</div>
                  <div className="author-meta">
                    <span className="author-school">MIT</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"As a driver, I love that I can offset my gas costs while helping out fellow students. The payment system is seamless, and I've built a regular group of riders."</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f59e0b'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3EEL%3C/text%3E%3C/svg%3E" alt="Emma L." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Emma Lee</div>
                  <div className="author-meta">
                    <span className="author-school">Stanford</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"The real-time tracking and in-app chat make coordination so easy. I feel safe knowing everyone is verified, and the community is really friendly."</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ec4899'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3EJC%3C/text%3E%3C/svg%3E" alt="James C." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">James Chen</div>
                  <div className="author-meta">
                    <span className="author-school">Berkeley</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"Perfect for weekend trips! I found a regular carpool group going to SF every Friday. We've become good friends and save a ton on Uber costs."</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%238b5cf6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3EAP%3C/text%3E%3C/svg%3E" alt="Aisha P." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Aisha Patel</div>
                  <div className="author-meta">
                    <span className="author-school">Harvard</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"The environmental impact tracker is awesome! It's great to see how much CO₂ I'm saving. Plus the money I save goes toward my textbooks."</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%233b82f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='40' font-family='Arial'%3EDR%3C/text%3E%3C/svg%3E" alt="David R." />
                </div>
                <div className="testimonial-author">
                  <div className="author-name">David Rodriguez</div>
                  <div className="author-meta">
                    <span className="author-school">USC</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <div className="testimonial-content">
                <p>"Best carpooling app for students, hands down. The smart matching actually works, and I always find rides when I need them. Highly recommend!"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-content">
            <div className="trust-header">
              <h2>Trusted by leading universities</h2>
              <p>Partnered with 50+ campuses nationwide</p>
            </div>
            <div className="trust-logos">
              <div className="trust-logo">UCLA</div>
              <div className="trust-logo">MIT</div>
              <div className="trust-logo">Stanford</div>
              <div className="trust-logo">Harvard</div>
              <div className="trust-logo">Berkeley</div>
              <div className="trust-logo">USC</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-gradient-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to start saving?</h2>
            <p>Join 10,000+ students who are already riding smarter</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn-cta primary">
                <span>Get Started Free</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 3l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/features" className="btn-cta secondary">
                <span>Learn More</span>
              </Link>
            </div>
            <div className="cta-note">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-1A6 6 0 108 2a6 6 0 000 12zm.93-9.412l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 4.588zM8 3.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <span>No credit card required • Free forever • Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <svg viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" fill="url(#footerGradient)" />
                    <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="footerGradient" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="logo-text">Campus Cruise</span>
              </div>
              <p className="footer-tagline">Making college travel affordable, safe, and sustainable.</p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 0C7.284 0 6.944.012 5.877.06 4.813.109 4.086.278 3.45.525a4.902 4.902 0 00-1.772 1.153A4.902 4.902 0 00.525 3.45C.278 4.086.109 4.813.06 5.877.012 6.944 0 7.284 0 10s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 001.153 1.772 4.902 4.902 0 001.772 1.153c.636.247 1.363.416 2.427.465C6.944 19.988 7.284 20 10 20s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.902 4.902 0 001.772-1.153 4.902 4.902 0 001.153-1.772c.247-.636.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 00-1.153-1.772A4.902 4.902 0 0016.55.525C15.914.278 15.187.109 14.123.06 13.056.012 12.716 0 10 0zm0 1.802c2.67 0 2.987.01 4.041.059.976.045 1.505.207 1.858.344.466.182.8.399 1.15.748.35.35.566.684.748 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.041 0 2.67-.01 2.986-.058 4.04-.045.976-.207 1.505-.344 1.858a3.097 3.097 0 01-.748 1.15c-.35.35-.684.566-1.15.748-.353.137-.882.3-1.857.344-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-.976-.045-1.505-.207-1.858-.344a3.097 3.097 0 01-1.15-.748 3.098 3.098 0 01-.748-1.15c-.137-.353-.3-.882-.344-1.857-.048-1.055-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.045-.976.207-1.505.344-1.858.182-.466.399-.8.748-1.15.35-.35.684-.566 1.15-.748.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M10 13.333a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm0-8.468a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm6.538-.203a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/features">Features</Link>
                <Link to="/pricing">Pricing</Link>
                <Link to="/about">About Us</Link>
                <a href="#">Roadmap</a>
                <a href="#">Changelog</a>
              </div>

              <div className="footer-column">
                <h4>Resources</h4>
                <a href="#">Help Center</a>
                <a href="#">Safety Guide</a>
                <a href="#">Community</a>
                <a href="#">Blog</a>
                <a href="#">API Docs</a>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">Careers</a>
                <a href="#">Press Kit</a>
                <a href="#">Partners</a>
                <a href="#">Contact</a>
              </div>

              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
                <a href="#">GDPR</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Campus Cruise. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
