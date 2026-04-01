const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 255]
      }
    },
    college: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20]
      }
    },
    role: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['passenger'],
      validate: {
        isValidRole(value) {
          if (!Array.isArray(value)) {
            throw new Error('Role must be an array');
          }
          const validRoles = ['driver', 'passenger'];
          const allValid = value.every(role => validRoles.includes(role));
          if (!allValid) {
            throw new Error('Role must contain only "driver" or "passenger"');
          }
          if (value.length === 0) {
            throw new Error('At least one role must be specified');
          }
        }
      }
    },
    vehicleMake: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vehicleModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vehicleColor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance method to compare passwords
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method to get public profile (exclude password)
  User.prototype.toPublicJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  // Define associations
  User.associate = (models) => {
    User.hasMany(models.Ride, {
      as: 'ridesAsDriver',
      foreignKey: 'driverId',
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Booking, {
      as: 'bookings',
      foreignKey: 'passengerId',
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Review, {
      as: 'reviewsReceived',
      foreignKey: 'driverId',
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Review, {
      as: 'reviewsGiven',
      foreignKey: 'reviewerId',
      onDelete: 'CASCADE'
    });
    User.hasMany(models.Message, {
      as: 'sentMessages',
      foreignKey: 'senderId',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.Wallet, {
      as: 'wallet',
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
  };

  return User;
};
