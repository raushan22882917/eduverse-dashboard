# Contributing to Eduverse Dashboard

Thank you for your interest in contributing to Eduverse Dashboard! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/eduverse-dashboard/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, versions)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/eduverse-dashboard.git
   cd eduverse-dashboard
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the code style guidelines
   - Write or update tests
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Wait for review and address feedback

## Development Setup

See the main [README.md](./README.md) for setup instructions.

## Code Style

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints for all functions
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Add docstrings to classes and functions

### TypeScript/React (Frontend)

- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Use meaningful component and variable names
- Format code with Prettier (if configured)

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage

## Documentation

- Update README.md if adding new features
- Add JSDoc/Python docstrings for new functions
- Update API documentation if adding new endpoints

## Questions?

Feel free to open an issue for any questions or clarifications!

