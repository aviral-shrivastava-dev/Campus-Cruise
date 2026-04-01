import { Link } from 'react-router-dom';
import './FeaturesPage.css';

function FeaturesPage() {
  return (
    <div className="features-page">
      <nav className="landing-nav">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🚗</span>
              <span className="logo-text">Campus Cruise</span>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="features-hero">
        <div className="container">
          <h1>Powerful Features for Smart Students</h1>
          <p>Everything you need to share rides safely and efficiently</p>
        </div>
      </section>

      <section className="features-detailed">
        <div className="container">
          <div className="feature-detail">
            <div className="feature-detail-content">
              <div className="feature-badge">Security</div>
              <h2>Campus-Verified Community</h2>
              <p>Only verified students from your college can join. We verify every user with their .edu email and student ID to ensure a safe, trusted community.</p>
              <ul className="feature-list">
                <li>✓ Email verification required</li>
                <li>✓ Student ID validation</li>
                <li>✓ Profile verification badges</li>
                <li>✓ Report and block features</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">🎓</div>
            </div>
          </div>

          <div className="feature-detail reverse">
            <div className="feature-detail-content">
              <div className="feature-badge">Smart Tech</div>
              <h2>AI-Powered Route Matching</h2>
              <p>Our intelligent algorithm finds the best ride matches based on your route, schedule, and preferences. Get instant notifications when rides match your needs.</p>
              <ul className="feature-list">
                <li>✓ Real-time route optimization</li>
                <li>✓ Schedule compatibility</li>
                <li>✓ Preference-based matching</li>
                <li>✓ Instant notifications</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">🗺️</div>
            </div>
          </div>

          <div className="feature-detail">
            <div className="feature-detail-content">
              <div className="feature-badge">Communication</div>
              <h2>Seamless In-App Messaging</h2>
              <p>Coordinate with drivers and riders without sharing personal contact info. Real-time chat, group conversations, and ride updates all in one place.</p>
              <ul className="feature-list">
                <li>✓ Private messaging</li>
                <li>✓ Group ride chats</li>
                <li>✓ Read receipts</li>
                <li>✓ Push notifications</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">💬</div>
            </div>
          </div>

          <div className="feature-detail reverse">
            <div className="feature-detail-content">
              <div className="feature-badge">Trust</div>
              <h2>Comprehensive Rating System</h2>
              <p>Build your reputation and make informed decisions. Rate drivers and riders after each trip to help maintain a high-quality community.</p>
              <ul className="feature-list">
                <li>✓ 5-star rating system</li>
                <li>✓ Detailed reviews</li>
                <li>✓ Driver statistics</li>
                <li>✓ Verified badges</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">⭐</div>
            </div>
          </div>

          <div className="feature-detail">
            <div className="feature-detail-content">
              <div className="feature-badge">Savings</div>
              <h2>Automatic Cost Splitting</h2>
              <p>Fair and transparent cost sharing. Set your contribution amount, and we'll handle the calculations. Track your savings over time.</p>
              <ul className="feature-list">
                <li>✓ Flexible pricing</li>
                <li>✓ Automatic calculations</li>
                <li>✓ Savings tracker</li>
                <li>✓ Payment history</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">💰</div>
            </div>
          </div>

          <div className="feature-detail reverse">
            <div className="feature-detail-content">
              <div className="feature-badge">Impact</div>
              <h2>Environmental Tracking</h2>
              <p>See the positive impact you're making. Track CO2 saved, miles shared, and your contribution to a greener campus.</p>
              <ul className="feature-list">
                <li>✓ Carbon footprint reduction</li>
                <li>✓ Impact dashboard</li>
                <li>✓ Community statistics</li>
                <li>✓ Achievement badges</li>
              </ul>
            </div>
            <div className="feature-detail-visual">
              <div className="visual-card">🌱</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience These Features?</h2>
            <p>Join Campus Cruise today and start riding smarter.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free
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

export default FeaturesPage;
