# SQL Injection Prevention

## Overview

This application uses Sequelize ORM, which automatically prevents SQL injection attacks through parameterized queries.

## How Sequelize Prevents SQL Injection

Sequelize uses parameterized queries (also called prepared statements) for all database operations. This means that user input is never directly concatenated into SQL queries.

### Safe Examples (Sequelize automatically parameterizes):

```javascript
// ✅ SAFE - Sequelize parameterizes the email value
User.findOne({ where: { email: userInput } });

// ✅ SAFE - Sequelize parameterizes all values in the where clause
Ride.findAll({
  where: {
    source: { [Op.like]: `%${userInput}%` },
    status: 'active'
  }
});

// ✅ SAFE - Sequelize parameterizes the update values
user.update({ name: userInput });

// ✅ SAFE - Sequelize parameterizes the create values
Ride.create({ source: userInput, destination: userInput2 });
```

### Unsafe Examples (NEVER DO THIS):

```javascript
// ❌ UNSAFE - Raw SQL with string concatenation
sequelize.query(`SELECT * FROM users WHERE email = '${userInput}'`);

// ❌ UNSAFE - Raw SQL without replacements
sequelize.query('SELECT * FROM users WHERE email = ' + userInput);
```

### Safe Raw Queries (if absolutely necessary):

```javascript
// ✅ SAFE - Using replacements parameter
sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: userInput },
    type: QueryTypes.SELECT
  }
);

// ✅ SAFE - Using bind parameters
sequelize.query(
  'SELECT * FROM users WHERE email = $1',
  {
    bind: [userInput],
    type: QueryTypes.SELECT
  }
);
```

## Best Practices

1. **Always use Sequelize methods** (findOne, findAll, create, update, destroy) instead of raw queries
2. **If raw queries are necessary**, always use the `replacements` or `bind` parameter
3. **Never concatenate user input** directly into SQL strings
4. **Validate and sanitize input** before passing to Sequelize (handled by our validation middleware)
5. **Use TypeScript or JSDoc** to ensure proper types are passed to Sequelize methods

## Verification

All controllers in this application use Sequelize methods properly. The codebase has been reviewed to ensure:
- No raw SQL queries with string concatenation
- All user input is passed through Sequelize's parameterized query system
- Input validation is performed before database operations

## Requirements Satisfied

- **Requirement 19.3**: "WHEN a database query is constructed, THEN the Campus Cruise System SHALL use parameterized queries via Sequelize to prevent SQL injection"
- **Property 76**: "For any database query construction, the system should use parameterized queries via Sequelize to prevent SQL injection"
