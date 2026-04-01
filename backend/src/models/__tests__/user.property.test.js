const fc = require('fast-check');
const bcrypt = require('bcrypt');
const { User, sequelize } = require('../index');

describe('User Model Property-Based Tests', () => {
  beforeAll(async () => {
    // Sync database before tests - this creates tables
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: {}, force: true });
  });

  /**
   * Feature: campus-cruise, Property 1: Registration creates hashed passwords
   * Validates: Requirements 1.1, 1.4
   */
  test('Property 1: Registration creates hashed passwords', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          name: fc.string({ minLength: 2, maxLength: 50 }),
          college: fc.string({ minLength: 2, maxLength: 50 }),
          phone: fc.string({ minLength: 10, maxLength: 15 })
        }),
        async (userData) => {
          const plainPassword = userData.password;
          
          // Create user with plain password
          const user = await User.create({
            ...userData,
            role: ['passenger']
          });

          // Password should be hashed (not equal to plain password)
          expect(user.password).not.toBe(plainPassword);
          
          // Password should be a valid bcrypt hash
          expect(user.password).toMatch(/^\$2[aby]\$.{56}$/);
          
          // Should be able to verify the password with bcrypt
          const isValid = await bcrypt.compare(plainPassword, user.password);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout

  /**
   * Feature: campus-cruise, Property 2: Role assignment preserves selection
   * Validates: Requirements 1.5
   */
  test('Property 2: Role assignment preserves selection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          name: fc.string({ minLength: 2, maxLength: 50 }),
          college: fc.string({ minLength: 2, maxLength: 50 }),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          role: fc.oneof(
            fc.constant(['driver']),
            fc.constant(['passenger']),
            fc.constant(['driver', 'passenger'])
          )
        }),
        async (userData) => {
          const selectedRoles = userData.role;
          
          // Create user with selected roles
          const user = await User.create(userData);

          // Retrieved user should have exactly the selected roles
          expect(user.role).toEqual(selectedRoles);
          
          // Verify by fetching from database
          const fetchedUser = await User.findByPk(user.id);
          expect(fetchedUser.role).toEqual(selectedRoles);
          
          // Should contain all selected roles
          selectedRoles.forEach(role => {
            expect(fetchedUser.role).toContain(role);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout
});
