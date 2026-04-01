const { Ride, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculate distance between two strings (simple Levenshtein-like approach)
 * For production, consider using a proper geocoding service
 */
const calculateStringDistance = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 1;
  
  // Simple character difference count
  const maxLen = Math.max(s1.length, s2.length);
  let differences = Math.abs(s1.length - s2.length);
  
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] !== s2[i]) differences++;
  }
  
  return differences / maxLen;
};

/**
 * Calculate time proximity score (lower is better)
 * Returns difference in hours
 */
const calculateTimeProximity = (targetTime, rideTime) => {
  const target = new Date(targetTime);
  const ride = new Date(rideTime);
  const diffMs = Math.abs(target - ride);
  return diffMs / (1000 * 60 * 60); // Convert to hours
};

/**
 * Check if a location is along a route (partial match)
 * Simple implementation - checks if location is substring of source or destination
 */
const isPartialMatch = (passengerLocation, rideSource, rideDestination) => {
  const location = passengerLocation.toLowerCase();
  const source = rideSource.toLowerCase();
  const destination = rideDestination.toLowerCase();
  
  return source.includes(location) || 
         destination.includes(location) || 
         location.includes(source) || 
         location.includes(destination);
};

/**
 * Match rides based on passenger preferences
 * Implements prioritization logic:
 * 1. Exact route matches
 * 2. Time proximity ranking
 * 3. Partial route matches
 * 4. Nearby alternatives
 */
const matchRides = async (preferences) => {
  const { 
    source, 
    destination, 
    preferredTime, 
    distanceThreshold = 0.3 // 30% string difference threshold
  } = preferences;

  try {
    // Fetch all available rides
    const allRides = await Ride.findAll({
      where: {
        status: 'active',
        availableSeats: { [Op.gt]: 0 },
        departureTime: { [Op.gt]: new Date() }
      },
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email', 'college', 'phone', 'vehicleMake', 'vehicleModel', 'vehicleColor', 'licensePlate']
      }],
      order: [['departureTime', 'ASC']]
    });

    // Categorize rides
    const exactMatches = [];
    const partialMatches = [];
    const nearbyAlternatives = [];

    for (const ride of allRides) {
      const sourceDistance = calculateStringDistance(source, ride.source);
      const destDistance = calculateStringDistance(destination, ride.destination);
      
      // Exact match: both source and destination match closely
      if (sourceDistance === 0 && destDistance === 0) {
        exactMatches.push({
          ride,
          matchType: 'exact',
          sourceDistance,
          destDistance,
          timeProximity: preferredTime ? calculateTimeProximity(preferredTime, ride.departureTime) : 0
        });
      }
      // Partial match: one location matches or is along the route
      else if (sourceDistance === 0 || destDistance === 0 || 
               isPartialMatch(source, ride.source, ride.destination) ||
               isPartialMatch(destination, ride.source, ride.destination)) {
        partialMatches.push({
          ride,
          matchType: 'partial',
          sourceDistance,
          destDistance,
          timeProximity: preferredTime ? calculateTimeProximity(preferredTime, ride.departureTime) : 0
        });
      }
      // Nearby alternative: within distance threshold
      else if (sourceDistance <= distanceThreshold && destDistance <= distanceThreshold) {
        nearbyAlternatives.push({
          ride,
          matchType: 'nearby',
          sourceDistance,
          destDistance,
          timeProximity: preferredTime ? calculateTimeProximity(preferredTime, ride.departureTime) : 0
        });
      }
    }

    // Sort each category by time proximity
    const sortByTimeProximity = (a, b) => a.timeProximity - b.timeProximity;
    
    exactMatches.sort(sortByTimeProximity);
    partialMatches.sort(sortByTimeProximity);
    nearbyAlternatives.sort(sortByTimeProximity);

    // Combine results with priority: exact > partial > nearby
    const results = [
      ...exactMatches,
      ...partialMatches,
      ...nearbyAlternatives
    ];

    return {
      success: true,
      data: results,
      summary: {
        total: results.length,
        exactMatches: exactMatches.length,
        partialMatches: partialMatches.length,
        nearbyAlternatives: nearbyAlternatives.length
      }
    };
  } catch (error) {
    console.error('Error matching rides:', error);
    throw error;
  }
};

/**
 * Get suggested rides for a passenger
 * Wrapper function for the matching algorithm
 */
const getSuggestedRides = async (req, res) => {
  try {
    const { source, destination, preferredTime, distanceThreshold } = req.query;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Source and destination are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const result = await matchRides({
      source,
      destination,
      preferredTime,
      distanceThreshold: distanceThreshold ? parseFloat(distanceThreshold) : 0.3
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting suggested rides:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get suggested rides',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  matchRides,
  getSuggestedRides,
  calculateStringDistance,
  calculateTimeProximity,
  isPartialMatch
};
