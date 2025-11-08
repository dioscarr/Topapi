# Contributing to Topapi

Thank you for your interest in contributing to Topapi! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Topapi.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your message"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env

# Add your Supabase credentials to .env
# Start development server
npm run dev
```

## Code Style

### JavaScript/Node.js

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Use async/await over promises when possible
- Add JSDoc comments for functions and modules

### Formatting

- Indentation: 2 spaces
- Line length: 100 characters max
- Use semicolons
- Use single quotes for strings
- Add trailing commas in objects and arrays

### Example

```javascript
/**
 * Authenticate user and return JWT token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and session data
 */
const authenticateUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new ApiError(401, error.message);
  }

  return data;
};
```

## Project Structure

```
Topapi/
├── api/
│   ├── middleware/       # Express middleware
│   ├── routes/           # API route handlers
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── public/               # Static files
└── docs/                 # Documentation
```

## Adding New Features

### Adding a New API Endpoint

1. Create or update a route file in `api/routes/`
2. Add JSDoc comments with Swagger annotations
3. Implement proper validation using express-validator
4. Handle errors appropriately
5. Update relevant tests

Example:

```javascript
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 */
router.post('/',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed');
      }

      // Implementation here
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Adding Middleware

1. Create a new file in `api/middleware/`
2. Export the middleware function
3. Add appropriate error handling
4. Document the middleware purpose

### Adding Database Tables

1. Create SQL migration in a `.sql` file
2. Document the table structure
3. Add Row Level Security policies
4. Update the API endpoints accordingly

## Testing

Before submitting a PR:

1. Test all modified endpoints manually
2. Test with invalid inputs
3. Verify authentication works correctly
4. Check error handling
5. Test in both development and production mode

### Manual Testing Checklist

- [ ] API starts without errors
- [ ] Health endpoints return correct data
- [ ] Authentication flow works
- [ ] Protected routes require authentication
- [ ] Validation rejects invalid inputs
- [ ] Error messages are clear and helpful
- [ ] Swagger documentation is updated and accurate

## Security Guidelines

### Critical Rules

- **Never commit secrets** - Use environment variables
- **Validate all inputs** - Use express-validator
- **Sanitize user input** - Prevent injection attacks
- **Use parameterized queries** - Prevent SQL injection
- **Implement rate limiting** - Prevent abuse
- **Use HTTPS in production** - Encrypt data in transit
- **Keep dependencies updated** - Fix security vulnerabilities

### Authentication

- Always use authentication middleware for protected routes
- Validate JWT tokens properly
- Don't expose sensitive user data
- Implement proper password requirements

### Data Access

- Always use Row Level Security in Supabase
- Verify users can only access their own data
- Use UUID instead of sequential IDs
- Log security-relevant events

## Documentation

### Code Documentation

- Add JSDoc comments to all functions
- Include parameter types and return types
- Explain complex logic with inline comments
- Document environment variables

### API Documentation

- Use Swagger/OpenAPI annotations
- Provide example requests and responses
- Document error responses
- Keep documentation in sync with code

### README Updates

- Update README.md for new features
- Add examples for new endpoints
- Update environment variable list
- Add troubleshooting tips

## Pull Request Process

### Before Submitting

1. Ensure your code follows the style guide
2. Update documentation
3. Test thoroughly
4. Update CHANGELOG.md (if exists)
5. Rebase on latest main branch

### PR Title Format

Use conventional commits format:

- `feat: Add user notification system`
- `fix: Correct authentication middleware bug`
- `docs: Update API documentation`
- `refactor: Improve error handling`
- `test: Add tests for profile routes`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Manual testing completed
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Supabase Connection Issues

- Verify credentials in `.env`
- Check Supabase dashboard for service status
- Ensure database tables are created

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC License).

---

Thank you for contributing to Topapi! 🚀
