# Contributing to FocusFlow

Thank you for your interest in contributing to FocusFlow! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building a tool to help students, let's keep the environment positive and inclusive.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/focusflow.git`
3. Create a branch: `git checkout -b feature/my-new-feature`
4. Make your changes
5. Test your changes: `npm test && npm run test:e2e`
6. Commit with clear messages: `git commit -m "Add feature: description"`
7. Push to your fork: `git push origin feature/my-new-feature`
8. Open a Pull Request

## Development Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### Commit Messages
Use clear, descriptive commit messages:
- `feat: Add pomodoro mode to timer`
- `fix: Resolve timer reconciliation issue on iOS`
- `docs: Update README with deployment instructions`
- `test: Add E2E tests for sync flow`

### Code Style
- Follow the existing code style
- Use TypeScript for type safety
- Run `npm run lint` before committing
- Use meaningful variable and function names

### Testing
- Write unit tests for new utility functions
- Add E2E tests for new user flows
- Ensure all tests pass before submitting PR

### Accessibility
- Maintain minimum 44x44px touch targets
- Ensure color contrast ratio ≥ 4.5:1
- Test with keyboard navigation
- Test with screen readers when possible

## Pull Request Process

1. Update README.md with details of changes if applicable
2. Ensure all tests pass
3. Update documentation as needed
4. Request review from maintainers
5. Address feedback and iterate

## Areas for Contribution

### High Priority
- Analytics dashboard implementation
- Heatmap calendar component
- Subject breakdown charts
- Magic link authentication flow
- Sync conflict resolution UI

### Medium Priority
- Push notification system
- Planned sessions feature
- Export data functionality
- Dark mode improvements
- Additional timer modes (pomodoro, deep work)

### Nice to Have
- Settings page
- Multiple theme options
- Keyboard shortcuts
- Desktop notifications
- Statistics exports

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about implementation
- Clarification on requirements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
