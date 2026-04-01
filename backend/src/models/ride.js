module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define('Ride', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isFutureDate(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Departure time must be in the future');
          }
        }
      }
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        isPositive(value) {
          if (value <= 0) {
            throw new Error('Total seats must be a positive integer');
          }
        }
      }
    },
    pricePerSeat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'rides',
    timestamps: true,
    indexes: [
      {
        fields: ['source', 'destination', 'departureTime']
      },
      {
        fields: ['driverId']
      },
      {
        fields: ['status', 'departureTime']
      }
    ]
  });

  // Define associations
  Ride.associate = (models) => {
    Ride.belongsTo(models.User, {
      as: 'driver',
      foreignKey: 'driverId'
    });
    Ride.hasMany(models.Booking, {
      as: 'bookings',
      foreignKey: 'rideId',
      onDelete: 'CASCADE'
    });
    Ride.hasMany(models.Message, {
      as: 'messages',
      foreignKey: 'rideId',
      onDelete: 'CASCADE'
    });
    Ride.hasMany(models.Review, {
      as: 'reviews',
      foreignKey: 'rideId',
      onDelete: 'CASCADE'
    });
    Ride.hasMany(models.RidePayment, {
      as: 'payments',
      foreignKey: 'rideId',
      onDelete: 'CASCADE'
    });
    Ride.hasMany(models.SplitPayment, {
      as: 'splitPayments',
      foreignKey: 'rideId',
      onDelete: 'CASCADE'
    });
  };

  return Ride;
};
