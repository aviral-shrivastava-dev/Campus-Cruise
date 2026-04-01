'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('split_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      rideId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rides',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      initiatorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      participantCount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amountPerPerson: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paidCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'partial', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      participants: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('split_payments', ['rideId']);
    await queryInterface.addIndex('split_payments', ['initiatorId']);
    await queryInterface.addIndex('split_payments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('split_payments');
  }
};
