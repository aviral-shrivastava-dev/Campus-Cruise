'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add explicit index on bookings.id for foreign key references
    const indexes = await queryInterface.showIndex('bookings');
    const hasIdIndex = indexes.some(idx => 
      idx.fields && idx.fields.length === 1 && idx.fields[0].attribute === 'id'
    );

    if (!hasIdIndex) {
      await queryInterface.addIndex('bookings', ['id'], {
        name: 'bookings_id_index'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('bookings', 'bookings_id_index');
  }
};
