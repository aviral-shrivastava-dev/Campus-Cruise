const { validationResult } = require('express-validator');
const { Ride } = require('../models');
const {
  startLocationTracking,
  stopLocationTracking,
  updateLocation,
  getLocation
} = require('../services/location.service');

/**
 * Start tracking location for a ride
 * POST /api/rides/:id/start-tracking
 */
const startTracking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: rideId } = req.params;
    const userId = req.user.id;

    // Find the ride
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify the user is the driver
    if (ride.driverId !== userId) {
      return res.status(403).json({ error: 'Only the driver can start tracking' });
    }

    // Check if ride is active
    if (ride.status !== 'active') {
      return res.status(400).json({ error: 'Can only track active rides' });
    }

    // Start tracking
    await startLocationTracking(rideId, userId);

    res.json({
      success: true,
      message: 'Location tracking started',
      rideId
    });
  } catch (error) {
    console.error('Error starting tracking:', error);
    res.status(500).json({ error: 'Failed to start location tracking' });
  }
};

/**
 * Stop tracking location for a ride
 * POST /api/rides/:id/stop-tracking
 */
const stopTracking = async (req, res) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;

    // Find the ride
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify the user is the driver
    if (ride.driverId !== userId) {
      return res.status(403).json({ error: 'Only the driver can stop tracking' });
    }

    // Stop tracking
    await stopLocationTracking(rideId);

    res.json({
      success: true,
      message: 'Location tracking stopped',
      rideId
    });
  } catch (error) {
    console.error('Error stopping tracking:', error);
    res.status(500).json({ error: 'Failed to stop location tracking' });
  }
};

/**
 * Update location for a ride
 * PUT /api/rides/:id/location
 */
const updateRideLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: rideId } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    // Find the ride
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Verify the user is the driver
    if (ride.driverId !== userId) {
      return res.status(403).json({ error: 'Only the driver can update location' });
    }

    // Get Socket.io instance
    const io = req.app.get('io');

    // Update location
    const locationData = await updateLocation(rideId, latitude, longitude, io);

    res.json({
      success: true,
      message: 'Location updated',
      location: locationData
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * Get current location for a ride
 * GET /api/rides/:id/location
 */
const getRideLocation = async (req, res) => {
  try {
    const { id: rideId } = req.params;

    // Find the ride
    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Get location
    const location = await getLocation(rideId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found for this ride' });
    }

    res.json({
      success: true,
      rideId,
      location
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
};

module.exports = {
  startTracking,
  stopTracking,
  updateRideLocation,
  getRideLocation
};
