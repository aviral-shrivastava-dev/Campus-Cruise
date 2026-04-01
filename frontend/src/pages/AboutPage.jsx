import { Link } from 'react-router-dom';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
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
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="about-hero">
        <div className="container">
          <h1>Building the Future of Campus Transportation</h1>
          <p>We're on a mission to make college travel affordable, sustainable, and social</p>
        </div>
      </section>

      <section className="about-story">
        <div className="container">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>
              Campus Cruise was born from a simple observation: thousands of students drive the same routes every day, 
              often alone, while others struggle to find affordable transportation. We saw an opportunity to connect 
              these students, reduce costs, and build community.
            </p>
            <p>
              Founded in 2024 by college students who experienced these challenges firsthand, we've grown to serve 
              over 10,000 students across multiple campuses. Our platform has facilitated over 50,000 shared rides, 
              saving students millions of dollars and reducing carbon emissions significantly.
            </p>
          </div>
        </div>
      </section>

      <section className="about-mission">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To make campus transportation accessible, affordable, and sustainable for every student 
                while fostering meaningful connections within college communities.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">👁️</div>
              <h3>Our Vision</h3>
              <p>
                A future where every student has access to safe, affordable transportation, and where 
                campuses are connected by a thriving community of shared mobility.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">💎</div>
              <h3>Our Values</h3>
              <p>
                Safety first, community-driven, environmentally conscious, student-focused, 
                and committed to making a positive impact on campus life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-impact">
        <div className="container">
          <h2>Our Impact</h2>
          <div className="impact-grid">
            <div className="impact-stat">
              <div className="impact-number">10,000+</div>
              <div className="impact-label">Active Students</div>
              <p>Across 50+ campuses nationwide</p>
            </div>
            <div className="impact-stat">
              <div className="impact-number">50,000+</div>
              <div className="impact-label">Rides Shared</div>
              <p>And counting every single day</p>
            </div>
            <div className="impact-stat">
              <div className="impact-number">$2M+</div>
              <div className="impact-label">Money Saved</div>
              <p>Put back in students' pockets</p>
            </div>
            <div className="impact-stat">
              <div className="impact-number">500 Tons</div>
              <div className="impact-label">CO2 Reduced</div>
              <p>Making campuses greener</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="container">
          <h2>Meet the Team</h2>
          <p className="team-intro">
            We're a passionate group of students, developers, and transportation enthusiasts 
            dedicated to revolutionizing campus mobility.
          </p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">👨‍💼</div>
              <h3>Alex Chen</h3>
              <p className="member-role">Co-Founder & CEO</p>
              <p className="member-bio">Former Stanford student who spent too much on Ubers</p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👩‍💻</div>
              <h3>Sarah Johnson</h3>
              <p className="member-role">Co-Founder & CTO</p>
              <p className="member-bio">MIT grad passionate about sustainable tech</p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👨‍🎨</div>
              <h3>Marcus Williams</h3>
              <p className="member-role">Head of Design</p>
              <p className="member-bio">Making carpooling beautiful, one pixel at a time</p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👩‍🔬</div>
              <h3>Emily Rodriguez</h3>
              <p className="member-role">Head of Safety</p>
              <p className="member-bio">Ensuring every ride is secure and trusted</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Growing Community</h2>
            <p>Be part of the campus transportation revolution.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Today
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

export default AboutPage;
