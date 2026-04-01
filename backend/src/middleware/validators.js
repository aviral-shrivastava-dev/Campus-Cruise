const { body, param, query } = require('express-validator');

/**
 * Email validation regex pattern
 * Validates standard email format
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .isString().withMessage('Name must be a string'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .matches(emailRegex).withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  
  body('college')
    .trim()
    .notEmpty().withMessage('College is required')
    .isString().withMessage('College must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('College name must be between 2 and 100 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isString().withMessage('Phone must be a string')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isArray({ min: 1 }).withMessage('Role must be a non-empty array')
    .custom((value) => {
      const validRoles = ['driver', 'passenger'];
      const allValid = value.every(r => validRoles.includes(r));
      if (!allValid) {
        throw new Error('Role must contain only "driver" or "passenger"');
      }
      return true;
    }),
  
  body('vehicleInfo')
    .optional()
    .isObject().withMessage('Vehicle info must be an object'),
  
  body('vehicleInfo.make')
    .optional()
    .trim()
    .isString().withMessage('Vehicle make must be a string')
    .isLength({ max: 50 }).withMessage('Vehicle make must not exceed 50 characters'),
  
  body('vehicleInfo.model')
    .optional()
    .trim()
    .isString().withMessage('Vehicle model must be a string')
    .isLength({ max: 50 }).withMessage('Vehicle model must not exceed 50 characters'),
  
  body('vehicleInfo.color')
    .optional()
    .trim()
    .isString().withMessage('Vehicle color must be a string')
    .isLength({ max: 30 }).withMessage('Vehicle color must not exceed 30 characters'),
  
  body('vehicleInfo.licensePlate')
    .optional()
    .trim()
    .isString().withMessage('License plate must be a string')
    .isLength({ max: 20 }).withMessage('License plate must not exceed 20 characters')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .matches(emailRegex).withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
];

/**
 * Validation rules for ride creation
 */
const rideValidation = [
  body('source')
    .trim()
    .notEmpty().withMessage('Source is required')
    .isString().withMessage('Source must be a string')
    .isLength({ min: 2, max: 200 }).withMessage('Source must be between 2 and 200 characters'),
  
  body('destination')
    .trim()
    .notEmpty().withMessage('Destination is required')
    .isString().withMessage('Destination must be a string')
    .isLength({ min: 2, max: 200 }).withMessage('Destination must be between 2 and 200 characters'),
  
  body('departureTime')
    .notEmpty().withMessage('Departure time is required')
    .isISO8601().withMessage('Departure time must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),
  
  body('totalSeats')
    .notEmpty().withMessage('Total seats is required')
    .isInt({ min: 1 }).withMessage('Total seats must be a positive integer'),
  
  body('availableSeats')
    .optional()
    .isInt({ min: 0 }).withMessage('Available seats must be a non-negative integer')
];

/**
 * Validation rules for booking creation
 */
const bookingValidation = [
  body('rideId')
    .notEmpty().withMessage('Ride ID is required')
    .isUUID().withMessage('Ride ID must be a valid UUID')
];

/**
 * Validation rules for profile update
 */
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .matches(emailRegex).withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('college')
    .optional()
    .trim()
    .isString().withMessage('College must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('College name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isString().withMessage('Phone must be a string')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),
  
  body('vehicleMake')
    .optional()
    .trim()
    .isString().withMessage('Vehicle make must be a string')
    .isLength({ max: 50 }).withMessage('Vehicle make must not exceed 50 characters'),
  
  body('vehicleModel')
    .optional()
    .trim()
    .isString().withMessage('Vehicle model must be a string')
    .isLength({ max: 50 }).withMessage('Vehicle model must not exceed 50 characters'),
  
  body('vehicleColor')
    .optional()
    .trim()
    .isString().withMessage('Vehicle color must be a string')
    .isLength({ max: 30 }).withMessage('Vehicle color must not exceed 30 characters'),
  
  body('licensePlate')
    .optional()
    .trim()
    .isString().withMessage('License plate must be a string')
    .isLength({ max: 20 }).withMessage('License plate must not exceed 20 characters')
];

/**
 * Validation rules for message sending
 */
const messageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isString().withMessage('Content must be a string'),
  
  body('messageType')
    .notEmpty().withMessage('Message type is required')
    .isIn(['direct', 'group']).withMessage('Message type must be "direct" or "group"'),
  
  body('recipientId')
    .optional()
    .isUUID().withMessage('Recipient ID must be a valid UUID'),
  
  body('rideId')
    .optional()
    .isUUID().withMessage('Ride ID must be a valid UUID')
];

/**
 * Validation rules for review creation
 */
const reviewValidation = [
  body('rideId')
    .notEmpty().withMessage('Ride ID is required')
    .isUUID().withMessage('Ride ID must be a valid UUID'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  
  body('comment')
    .optional()
    .isString().withMessage('Comment must be a string')
    .trim()
];

/**
 * Validation rules for UUID parameters
 */
const uuidParamValidation = [
  param('id')
    .isUUID().withMessage('ID must be a valid UUID')
];

/**
 * Validation rules for ride query filters
 */
const rideQueryValidation = [
  query('source')
    .optional()
    .trim()
    .isString().withMessage('Source must be a string'),
  
  query('destination')
    .optional()
    .trim()
    .isString().withMessage('Destination must be a string'),
  
  query('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid date'),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
];

module.exports = {
  registerValidation,
  loginValidation,
  rideValidation,
  bookingValidation,
  profileUpdateValidation,
  messageValidation,
  reviewValidation,
  uuidParamValidation,
  rideQueryValidation
};
