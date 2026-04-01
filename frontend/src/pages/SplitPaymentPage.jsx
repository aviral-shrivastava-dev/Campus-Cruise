import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './SplitPaymentPage.css';

function SplitPaymentPage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRideData();
  }, [rideId]);

  const fetchRideData = async () => {
    try {
      setLoading(true);
      const rideData = await api.ride.getRide(rideId);
      setRide(rideData);
      
      // Fetch bookings for this ride
      const bookingsData = await api.booking.getRideBookings(rideId);
      setBookings(bookingsData.filter(b => b.status === 'confirmed'));
    } catch (error) {
      console.error('Error fetching ride:', error);
      alert('Failed to load ride information');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (passengerId) => {
    setSelectedParticipants(prev =>
      prev.includes(passengerId)
        ? prev.filter(id => id !== passengerId)
        : [...prev, passengerId]
    );
  };

  const handleCreateSplit = async () => {
    if (selectedParticipants.length < 2) {
      alert('Please select at least 2 participants');
      return;
    }

    setCreating(true);
    try {
      await api.payment.createSplitPayment(rideId, selectedParticipants);
      alert('Split payment created! Participants can now pay their share.');
      navigate('/wallet');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create split payment');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="split-payment-page loading">Loading...</div>;
  }

  const totalAmount = parseFloat(ride?.pricePerSeat || 0);
  const amountPerPerson = selectedParticipants.length > 0
    ? totalAmount / selectedParticipants.length
    : 0;

  return (
    <div className="split-payment-page">
      <Navbar />
      <div className="split-container">
        <h1>Split Payment</h1>

        <div className="ride-info">
          <h2>Ride Details</h2>
          <p><strong>From:</strong> {ride.source}</p>
          <p><strong>To:</strong> {ride.destination}</p>
          <p><strong>Total Cost:</strong> ${totalAmount.toFixed(2)}</p>
        </div>

        <div className="participants-section">
          <h2>Select Participants</h2>
          <p className="info-text">Choose who will split the payment</p>

          {bookings.length === 0 ? (
            <p className="no-bookings">No confirmed bookings for this ride</p>
          ) : (
            <div className="participants-list">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  className={`participant-item ${selectedParticipants.includes(booking.passengerId) ? 'selected' : ''}`}
                  onClick={() => toggleParticipant(booking.passengerId)}
                >
                  <div className="participant-info">
                    <div className="participant-name">{booking.passenger?.name}</div>
                    <div className="participant-email">{booking.passenger?.email}</div>
                  </div>
                  <div className="participant-checkbox">
                    {selectedParticipants.includes(booking.passengerId) && '✓'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedParticipants.length > 0 && (
          <div className="split-summary">
            <h2>Split Summary</h2>
            <div className="split-item">
              <span>Total Amount:</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>
            <div className="split-item">
              <span>Participants:</span>
              <strong>{selectedParticipants.length}</strong>
            </div>
            <div className="split-item highlight">
              <span>Amount per Person:</span>
              <strong>${amountPerPerson.toFixed(2)}</strong>
            </div>
          </div>
        )}

        <div className="split-actions">
          <button
            className="btn-primary"
            onClick={handleCreateSplit}
            disabled={creating || selectedParticipants.length < 2}
          >
            {creating ? 'Creating...' : 'Create Split Payment'}
          </button>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplitPaymentPage;
