import { Link } from 'react-router-dom';
import './PricingPage.css';

function PricingPage() {
  return (
    <div className="pricing-page">
      <nav className="landing-nav">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🚗</span>
              <span className="logo-text">Campus Cruise</span>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/features" className="nav-link">Features</Link>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pricing-hero">
        <div className="container">
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that works best for you</p>
        </div>
      </section>

      <section className="pricing-plans">
        <div className="container">
          <div className="plans-grid">
            <div className="pricing-card">
              <div className="plan-header">
                <h3>Free</h3>
                <div className="plan-price">
                  <span className="price">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="plan-features">
                <li>✓ Find and book rides</li>
                <li>✓ Post up to 5 rides/month</li>
                <li>✓ Basic messaging</li>
                <li>✓ Rating system</li>
                <li>✓ Campus verification</li>
                <li>✗ Priority support</li>
                <li>✗ Advanced filters</li>
                <li>✗ Analytics dashboard</li>
              </ul>
              <Link to="/signup" className="btn btn-secondary">
                Get Started
              </Link>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-header">
                <h3>Pro</h3>
                <div className="plan-price">
                  <span className="price">$4.99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="plan-features">
                <li>✓ Everything in Free</li>
                <li>✓ Unlimited ride posts</li>
                <li>✓ Priority in search results</li>
                <li>✓ Advanced route filters</li>
                <li>✓ Savings analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Custom preferences</li>
                <li>✓ No ads</li>
              </ul>
              <Link to="/signup" className="btn btn-primary">
                Start Pro Trial
              </Link>
            </div>

            <div className="pricing-card">
              <div className="plan-header">
                <h3>Campus</h3>
                <div className="plan-price">
                  <span className="price">Custom</span>
                </div>
              </div>
              <ul className="plan-features">
                <li>✓ Everything in Pro</li>
                <li>✓ Campus-wide deployment</li>
                <li>✓ Custom branding</li>
                <li>✓ Admin dashboard</li>
                <li>✓ Usage analytics</li>
                <li>✓ Dedicated support</li>
                <li>✓ API access</li>
                <li>✓ Custom integrations</li>
              </ul>
              <a href="#contact" className="btn btn-secondary">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Is Campus Cruise really free?</h3>
              <p>Yes! Our Free plan gives you access to all core features. You can find rides, post rides, and connect with other students at no cost.</p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards, debit cards, and digital wallets. All payments are processed securely.</p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel anytime?</h3>
              <p>Absolutely! You can cancel your Pro subscription at any time. No questions asked, no cancellation fees.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer student discounts?</h3>
              <p>Our pricing is already student-friendly! Plus, we offer special promotions throughout the year.</p>
            </div>
            <div className="faq-item">
              <h3>What's included in the Pro trial?</h3>
              <p>Get full access to all Pro features for 14 days, completely free. No credit card required to start.</p>
            </div>
            <div className="faq-item">
              <h3>How does Campus pricing work?</h3>
              <p>Campus plans are customized based on your institution's size and needs. Contact our sales team for a quote.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Saving?</h2>
            <p>Join thousands of students riding smarter today.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Campus Cruise</h4>
              <p>Making college travel affordable and sustainable.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/about">About Us</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Safety</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Campus Cruise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PricingPage;
