const fc = require('fast-check');

/**
 * Property-based testing utilities and custom generators
 * These generators create valid test data for property-based tests
 */

/**
 * Generator for valid email addresses
 * @returns {fc.Arbitrary<string>} Email address generator
 */
const emailGenerator = () => fc.emailAddress();

/**
 * Generator for valid passwords (8-50 characters)
 * @returns {fc.Arbitrary<string>} Password generator
 */
const passwordGenerator = () => 
  fc.string({ minLength: 8, maxLength: 50 });

/**
 * Generator for valid names (2-50 characters)
 * @returns {fc.Arbitrary<string>} Name generator
 */
const nameGenerator = () => 
  fc.string({ minLength: 2, maxLength: 50 })
    .filter(s => s.trim().length >= 2);

/**
 * Generator for valid phone numbers (10-15 digits)
 * @returns {fc.Arbitrary<string>} Phone number generator
 */
const phoneGenerator = () => 
  fc.stringOf(fc.integer({ min: 0, max: 9 }).map(n => n.toString()), { minLength: 10, maxLength: 15 });

/**
 * Generator for user roles
 * @returns {fc.Arbitrary<Array<string>>} Role array generator
 */
const roleGenerator = () => 
  fc.oneof(
    fc.constant(['driver']),
    fc.constant(['passenger']),
    fc.constant(['driver', 'passenger'])
  );

/**
 * Generator for valid user data
 * @returns {fc.Arbitrary<Object>} User data generator
 */
const userDataGenerator = () => 
  fc.record({
    email: emailGenerator(),
    password: passwordGenerator(),
    name: nameGenerator(),
    college: nameGenerator(),
    phone: phoneGenerator(),
    role: roleGenerator()
  });

/**
 * Generator for valid driver data (includes vehicle info)
 * @returns {fc.Arbitrary<Object>} Driver data generator
 */
const driverDataGenerator = () => 
  fc.record({
    email: emailGenerator(),
    password: passwordGenerator(),
    name: nameGenerator(),
    college: nameGenerator(),
    phone: phoneGenerator(),
    role: fc.constant(['driver']),
    vehicleMake: fc.string({ minLength: 2, maxLength: 30 }),
    vehicleModel: fc.string({ minLength: 2, maxLength: 30 }),
    vehicleColor: fc.string({ minLength: 2, maxLength: 20 }),
    licensePlate: fc.string({ minLength: 3, maxLength: 15 })
  });

/**
 * Generator for future dates (for ride departure times)
 * @param {Number} minHours - Minimum hours from now
 * @param {Number} maxHours - Maximum hours from now
 * @returns {fc.Arbitrary<Date>} Future date generator
 */
const futureDateGenerator = (minHours = 1, maxHours = 168) => 
  fc.integer({ min: minHours * 60 * 60 * 1000, max: maxHours * 60 * 60 * 1000 })
    .map(ms => new Date(Date.now() + ms));

/**
 * Generator for past dates
 * @param {Number} minHours - Minimum hours ago
 * @param {Number} maxHours - Maximum hours ago
 * @returns {fc.Arbitrary<Date>} Past date generator
 */
const pastDateGenerator = (minHours = 1, maxHours = 168) => 
  fc.integer({ min: minHours * 60 * 60 * 1000, max: maxHours * 60 * 60 * 1000 })
    .map(ms => new Date(Date.now() - ms));

/**
 * Generator for valid seat counts (1-10)
 * @returns {fc.Arbitrary<number>} Seat count generator
 */
const seatCountGenerator = () => 
  fc.integer({ min: 1, max: 10 });

/**
 * Generator for location names
 * @returns {fc.Arbitrary<string>} Location generator
 */
const locationGenerator = () => 
  fc.oneof(
    fc.constant('Campus Main Gate'),
    fc.constant('Downtown Mall'),
    fc.constant('Airport'),
    fc.constant('Train Station'),
    fc.constant('City Center'),
    fc.constant('University Library'),
    fc.constant('Student Housing'),
    fc.constant('Shopping District'),
    fc.string({ minLength: 5, maxLength: 50 })
  );

/**
 * Generator for valid ride data
 * @returns {fc.Arbitrary<Object>} Ride data generator
 */
const rideDataGenerator = () => 
  fc.record({
    source: locationGenerator(),
    destination: locationGenerator(),
    departureTime: futureDateGenerator(),
    availableSeats: seatCountGenerator(),
    totalSeats: seatCountGenerator()
  }).filter(data => data.source !== data.destination);

/**
 * Generator for ride status
 * @returns {fc.Arbitrary<string>} Status generator
 */
const rideStatusGenerator = () => 
  fc.oneof(
    fc.constant('active'),
    fc.constant('completed'),
    fc.constant('cancelled')
  );

/**
 * Generator for booking status
 * @returns {fc.Arbitrary<string>} Booking status generator
 */
const bookingStatusGenerator = () => 
  fc.oneof(
    fc.constant('confirmed'),
    fc.constant('cancelled')
  );

/**
 * Generator for message type
 * @returns {fc.Arbitrary<string>} Message type generator
 */
const messageTypeGenerator = () => 
  fc.oneof(
    fc.constant('direct'),
    fc.constant('group')
  );

/**
 * Generator for message content
 * @returns {fc.Arbitrary<string>} Message content generator
 */
const messageContentGenerator = () => 
  fc.string({ minLength: 1, maxLength: 500 });

/**
 * Generator for review ratings (1-5)
 * @returns {fc.Arbitrary<number>} Rating generator
 */
const ratingGenerator = () => 
  fc.integer({ min: 1, max: 5 });

/**
 * Generator for review comments
 * @returns {fc.Arbitrary<string>} Comment generator
 */
const reviewCommentGenerator = () => 
  fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null });

/**
 * Generator for coordinates (latitude/longitude)
 * @returns {fc.Arbitrary<Object>} Coordinates generator
 */
const coordinatesGenerator = () => 
  fc.record({
    latitude: fc.double({ min: -90, max: 90 }),
    longitude: fc.double({ min: -180, max: 180 })
  });

/**
 * Generator for JWT token payloads
 * @returns {fc.Arbitrary<Object>} JWT payload generator
 */
const jwtPayloadGenerator = () => 
  fc.record({
    id: fc.uuid(),
    role: roleGenerator()
  });

/**
 * Generator for invalid email addresses
 * @returns {fc.Arbitrary<string>} Invalid email generator
 */
const invalidEmailGenerator = () => 
  fc.oneof(
    fc.constant('notanemail'),
    fc.constant('missing@domain'),
    fc.constant('@nodomain.com'),
    fc.constant('spaces in@email.com'),
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => !s.includes('@'))
  );

/**
 * Generator for invalid seat counts (zero, negative, or non-integer)
 * @returns {fc.Arbitrary<number>} Invalid seat count generator
 */
const invalidSeatCountGenerator = () => 
  fc.oneof(
    fc.constant(0),
    fc.integer({ min: -100, max: -1 }),
    fc.double({ min: 0.1, max: 10.9 })
  );

/**
 * Generator for whitespace strings (for testing empty input validation)
 * @returns {fc.Arbitrary<string>} Whitespace string generator
 */
const whitespaceStringGenerator = () => 
  fc.stringOf(
    fc.oneof(
      fc.constant(' '),
      fc.constant('\t'),
      fc.constant('\n'),
      fc.constant('\r')
    ),
    { minLength: 1, maxLength: 20 }
  );

/**
 * Generator for SQL injection attempts
 * @returns {fc.Arbitrary<string>} SQL injection string generator
 */
const sqlInjectionGenerator = () => 
  fc.oneof(
    fc.constant("'; DROP TABLE users; --"),
    fc.constant("1' OR '1'='1"),
    fc.constant("admin'--"),
    fc.constant("' OR 1=1--"),
    fc.constant("1; DELETE FROM rides WHERE 1=1")
  );

/**
 * Generator for XSS attack strings
 * @returns {fc.Arbitrary<string>} XSS string generator
 */
const xssStringGenerator = () => 
  fc.oneof(
    fc.constant('<script>alert("XSS")</script>'),
    fc.constant('<img src=x onerror=alert("XSS")>'),
    fc.constant('<svg onload=alert("XSS")>'),
    fc.constant('javascript:alert("XSS")'),
    fc.constant('<iframe src="javascript:alert(\'XSS\')"></iframe>')
  );

/**
 * Property test configuration with 100 iterations
 */
const propertyTestConfig = {
  numRuns: 100,
  verbose: false
};

/**
 * Helper to run property tests with standard configuration
 * @param {fc.Arbitrary} arbitrary - The arbitrary to test
 * @param {Function} predicate - The property to verify
 * @param {Object} config - Optional configuration overrides
 */
const runPropertyTest = async (arbitrary, predicate, config = {}) => {
  await fc.assert(
    fc.asyncProperty(arbitrary, predicate),
    { ...propertyTestConfig, ...config }
  );
};

module.exports = {
  // Basic generators
  emailGenerator,
  passwordGenerator,
  nameGenerator,
  phoneGenerator,
  roleGenerator,
  
  // Complex generators
  userDataGenerator,
  driverDataGenerator,
  rideDataGenerator,
  jwtPayloadGenerator,
  coordinatesGenerator,
  
  // Date generators
  futureDateGenerator,
  pastDateGenerator,
  
  // Specific field generators
  seatCountGenerator,
  locationGenerator,
  rideStatusGenerator,
  bookingStatusGenerator,
  messageTypeGenerator,
  messageContentGenerator,
  ratingGenerator,
  reviewCommentGenerator,
  
  // Invalid data generators
  invalidEmailGenerator,
  invalidSeatCountGenerator,
  whitespaceStringGenerator,
  sqlInjectionGenerator,
  xssStringGenerator,
  
  // Utilities
  propertyTestConfig,
  runPropertyTest
};
