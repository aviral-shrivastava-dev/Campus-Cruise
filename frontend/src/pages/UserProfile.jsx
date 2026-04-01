import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DriverRatings from '../components/DriverRatings';
import LoadingSpinner from '../components/LoadingSpinner';
import './UserProfile.css';

function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalBookings: 0,
    completedRides: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    college: '',
    phone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    licensePlate: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch profile and stats in parallel
      const [profileResponse, ridesResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        api.user.getUser(user.id).catch(() => ({ data: null })),
        api.user.getUserRides(user.id).catch(() => ({ data: [] })),
        api.user.getUserBookings(user.id).catch(() => ({ data: [] })),
        api.review.getDriverReviews(user.id).catch(() => ({ data: { averageRating: 0 } }))
      ]);

      // Parse profile
      const profileData = profileResponse.data?.data || profileResponse.data?.user || profileResponse.data;
      setProfile(profileData);

      // Parse rides
      let rides = [];
      if (ridesResponse.data) {
        if (Array.isArray(ridesResponse.data)) {
          rides = ridesResponse.data;
        } else if (Array.isArray(ridesResponse.data.data)) {
          rides = ridesResponse.data.data;
        }
      }

      // Parse bookings
      let bookings = [];
      if (bookingsResponse.data) {
        if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse.data.data)) {
          bookings = bookingsResponse.data.data;
        }
      }

      // Calculate stats
      const completedRides = rides.filter(r => r.status === 'completed').length;
      const rating = reviewsResponse.data?.data?.averageRating || reviewsResponse.data?.averageRating || 0;

      setStats({
        totalRides: rides.length,
        totalBookings: bookings.length,
        completedRides,
        rating: parseFloat(rating)
      });
      
      // Initialize form data
      setFormData({
        name: profileData.name || '',
        college: profileData.college || '',
        phone: profileData.phone || '',
        vehicleMake: profileData.vehicleMake || '',
        vehicleModel: profileData.vehicleModel || '',
        vehicleColor: profileData.vehicleColor || '',
        licensePlate: profileData.licensePlate || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        name: profile.name || '',
        college: profile.college || '',
        phone: profile.phone || '',
        vehicleMake: profile.vehicleMake || '',
        vehicleModel: profile.vehicleModel || '',
        vehicleColor: profile.vehicleColor || '',
        licensePlate: profile.licensePlate || ''
      });
      setSaveError(null);
      setSaveSuccess(false);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(true);
      setSaveError(null);
      setSaveSuccess(false);

      const response = await api.user.updateProfile(user.id, formData);
      const updatedProfile = response.data?.data || response.data?.user || response.data;
      
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSaveSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const isDriver = profile?.role?.includes('driver');

  if (loading) {
    return (
      <div className="user-profile-page">
        <Navbar />
        <div className="page-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-profile-page">
        <Navbar />
        <div className="page-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error || 'Profile not found'}</p>
            <button className="btn-retry" onClick={fetchProfileData}>
              Try Again
            </button>
            <button className="btn-back" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <Navbar />
      
      <div className="page-container">
        {/* Profile Header Card */}
        <div className="profile-header-card">
          <div className="profile-banner"></div>
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-header-info">
              <h1>{profile.name}</h1>
              <p className="profile-email">{profile.email}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <span className="meta-icon">🎓</span>
                  {profile.college}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📞</span>
                  {profile.phone}
                </span>
              </div>
              <div className="profile-roles">
                {profile.role?.map(role => (
                  <span key={role} className="role-badge">
                    {role === 'driver' ? '🚗 Driver' : '👤 Passenger'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-blue">🚗</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalRides}</div>
              <div className="stat-label">Rides Offered</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-green">🎫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalBookings}</div>
              <div className="stat-label">Rides Booked</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-purple">✓</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedRides}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-yellow">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            Profile
          </button>
          {isDriver && (
            <button
              className={`tab ${activeTab === 'vehicle' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicle')}
            >
              <span className="tab-icon">🚗</span>
              Vehicle
            </button>
          )}
          {isDriver && (
            <button
              className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratings')}
            >
              <span className="tab-icon">⭐</span>
              Ratings
            </button>
          )}
        </div>

        {/* Content */}
        <div className="profile-content-card">
          {saveSuccess && (
            <div className="success-message">
              <span className="message-icon">✓</span>
              Profile updated successfully!
            </div>
          )}

          {saveError && (
            <div className="error-message">
              <span className="message-icon">⚠️</span>
              {saveError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-form">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="form-section">
                <div className="section-header">
                  <h2>Personal Information</h2>
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn-edit-inline"
                      onClick={handleEditToggle}
                    >
                      <span>✏️</span> Edit
                    </button>
                  )}
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="college">College</label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={profile.email}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && isDriver && (
              <div className="form-section">
                <div className="section-header">
                  <h2>Vehicle Information</h2>
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn-edit-inline"
                      onClick={handleEditToggle}
                    >
                      <span>✏️</span> Edit
                    </button>
                  )}
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="vehicleMake">Vehicle Make</label>
                    <input
                      type="text"
                      id="vehicleMake"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., Toyota"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="vehicleModel">Vehicle Model</label>
                    <input
                      type="text"
                      id="vehicleModel"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., Camry"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="vehicleColor">Vehicle Color</label>
                    <input
                      type="text"
                      id="vehicleColor"
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., Blue"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="licensePlate">License Plate</label>
                    <input
                      type="text"
                      id="licensePlate"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., ABC-1234"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && isDriver && (
              <div className="ratings-section">
                <DriverRatings driverId={user.id} driverName={profile.name} />
              </div>
            )}

            {/* Form Actions */}
            {isEditing && (activeTab === 'profile' || activeTab === 'vehicle') && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleEditToggle}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Quick Actions */}
          {!isEditing && (
            <div className="quick-actions">
              <button
                className="action-btn action-primary"
                onClick={() => navigate('/my-rides')}
              >
                <span className="action-icon">🚗</span>
                <div className="action-content">
                  <div className="action-title">My Rides</div>
                  <div className="action-desc">View your rides</div>
                </div>
              </button>
              <button
                className="action-btn action-secondary"
                onClick={() => navigate('/history')}
              >
                <span className="action-icon">📋</span>
                <div className="action-content">
                  <div className="action-title">Ride History</div>
                  <div className="action-desc">View past rides</div>
                </div>
              </button>
              <button
                className="action-btn action-tertiary"
                onClick={() => navigate('/messages')}
              >
                <span className="action-icon">💬</span>
                <div className="action-content">
                  <div className="action-title">Messages</div>
                  <div className="action-desc">Chat with riders</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
