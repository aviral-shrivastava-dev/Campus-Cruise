module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
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
    passengerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },
    isLateCancellation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      // MySQL doesn't support partial unique indexes
      // Uniqueness is enforced at application level (checking status='confirmed')
      {
        name: 'bookings_ride_passenger_status_idx',
        fields: ['rideId', 'passengerId', 'status']
      },
      {
        fields: ['rideId']
      },
      {
        fields: ['passengerId']
      }
    ]
  });

  // Define associations
  Booking.associate = (models) => {
    Booking.belongsTo(models.Ride, {
      as: 'ride',
      foreignKey: 'rideId'
    });
    Booking.belongsTo(models.User, {
      as: 'passenger',
      foreignKey: 'passengerId'
    });
    Booking.hasOne(models.RidePayment, {
      as: 'payment',
      foreignKey: 'bookingId',
      onDelete: 'CASCADE'
    });
  };

  return Booking;
};
