module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
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
    reviewerId: {
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        max: 5,
        isValidRating(value) {
          if (value < 1 || value > 5) {
            throw new Error('Rating must be between 1 and 5');
          }
        }
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['rideId', 'reviewerId']
      },
      {
        fields: ['driverId']
      },
      {
        fields: ['rideId']
      }
    ]
  });

  // Define associations
  Review.associate = (models) => {
    Review.belongsTo(models.Ride, {
      as: 'ride',
      foreignKey: 'rideId'
    });
    Review.belongsTo(models.User, {
      as: 'reviewer',
      foreignKey: 'reviewerId'
    });
    Review.belongsTo(models.User, {
      as: 'driver',
      foreignKey: 'driverId'
    });
  };

  return Review;
};
