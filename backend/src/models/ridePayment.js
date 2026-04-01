module.exports = (sequelize, DataTypes) => {
  const RidePayment = sequelize.define('RidePayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    rideId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'rides',
        key: 'id'
      }
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    passengerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    creditsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rewardPointsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    cashbackEarned: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    rewardPointsEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    paymentMethod: {
      type: DataTypes.ENUM('wallet', 'credits', 'mixed', 'split'),
      allowNull: false,
      defaultValue: 'wallet'
    },
    status: {
      type: DataTypes.ENUM('pending', 'held', 'completed', 'refunded', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    splitPaymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to split payment group'
    },
    escrowTransactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Transaction ID for escrowed funds'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ride_payments',
    timestamps: true,
    indexes: [
      {
        fields: ['rideId']
      },
      {
        fields: ['bookingId'],
        unique: true
      },
      {
        fields: ['passengerId']
      },
      {
        fields: ['driverId']
      },
      {
        fields: ['status']
      }
    ]
  });

  RidePayment.associate = (models) => {
    RidePayment.belongsTo(models.Ride, {
      as: 'ride',
      foreignKey: 'rideId'
    });
    RidePayment.belongsTo(models.Booking, {
      as: 'booking',
      foreignKey: 'bookingId'
    });
    RidePayment.belongsTo(models.User, {
      as: 'passenger',
      foreignKey: 'passengerId'
    });
    RidePayment.belongsTo(models.User, {
      as: 'driver',
      foreignKey: 'driverId'
    });
  };

  return RidePayment;
};
