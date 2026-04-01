'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all existing indexes on bookings table
    const indexes = await queryInterface.showIndex('bookings');
    console.log('Current indexes on bookings table:', JSON.stringify(indexes, null, 2));
    
    // Find and remove ALL unique constraints EXCEPT the primary key
    const uniqueIndexes = indexes.filter(idx => 
      (idx.unique === true || idx.unique === 1) && 
      idx.primary !== true &&
      idx.name !== 'PRIMARY'
    );
    
    console.log('Unique indexes to remove:', uniqueIndexes.map(idx => idx.name));
    
    for (const idx of uniqueIndexes) {
      try {
        console.log('Removing unique index:', idx.name);
        await queryInterface.removeIndex('bookings', idx.name);
        console.log('Successfully removed:', idx.name);
      } catch (err) {
        console.log('Error removing index:', idx.name, err.message);
      }
    }
    
    // Add a regular (non-unique) index for performance
    try {
      await queryInterface.addIndex('bookings', {
        name: 'bookings_ride_passenger_status_idx',
        fields: ['rideId', 'passengerId', 'status']
      });
      console.log('Added performance index');
    } catch (err) {
      console.log('Performance index might already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the performance index
    try {
      await queryInterface.removeIndex('bookings', 'bookings_ride_passenger_status_idx');
    } catch (err) {
      console.log('Index might not exist');
    }
    
    // Note: We don't restore the unique constraints as they cause issues with rebooking
    console.log('Not restoring unique constraints - handled at application level');
  }
};
