# Contributing Guidelines

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Commit Message Format

Use conventional commits:

```
type(scope): subject

body

footer
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Build, dependencies

### Examples
```
feat(auth): add JWT refresh token logic
fix(api): handle empty response correctly
docs(readme): update installation instructions
refactor(utils): simplify password validation
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Address feedback

## Code Standards

### TypeScript
- Use strict mode
- Avoid `any`
- Export named types
- Use interfaces for objects

### File Structure
- Keep files under 300 lines
- One component per file
- Group related logic
- Use meaningful names

### Comments
- Comment why, not what
- Keep comments updated
- Avoid obvious comments

```typescript
// Good: explains the reasoning
// We use Promise.all here for parallel execution
// instead of sequential await to improve performance

// Bad: just restates the code
// Create a new array
const items = [];
```

## Testing

- Write tests for new features
- Maintain >80% coverage
- Test edge cases
- Use descriptive test names

```typescript
describe('authService.login', () => {
  it('should return user and tokens on valid credentials', async () => {
    // test code
  });

  it('should throw AppError on invalid password', async () => {
    // test code
  });
});
```

## Performance

- Avoid unnecessary re-renders (React.memo, useMemo)
- Optimize database queries
- Use proper caching strategies
- Monitor bundle size

## Security

- Never commit secrets
- Validate all inputs
- Use HTTPS in production
- Sanitize user input
- Follow OWASP guidelines

## Documentation

- Update README if needed
- Document complex logic
- Add JSDoc comments for functions
- Keep CHANGELOG updated

```typescript
/**
 * Authenticate user and return tokens
 * @param email - User email address
 * @param password - User password
 * @returns Authentication response with tokens
 * @throws AppError if credentials invalid
 */
export async function login(email: string, password: string) {
  // implementation
}
```

## Review Checklist

- [ ] Code follows style guide
- [ ] Changes are well-tested
- [ ] Documentation is updated
- [ ] No console.log left in code
- [ ] No hardcoded secrets
- [ ] Performance impact considered
- [ ] Backwards compatibility maintained

## Questions?

- Open an issue for bugs
- Start a discussion for features
- Ask questions in pull requests
- Join community chat

Thank you for contributing!
