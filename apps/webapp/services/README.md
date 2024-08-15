# Services Folder

The `services/` directory is a crucial part of our application architecture, designed to encapsulate and manage interactions with external APIs and data sources. This README outlines the key principles and conventions for working with services in our project.

## Key Principles

1. **User-Friendly Error Handling**: All code in the services directory is designed to throw user-friendly errors that can be easily caught and displayed by tanStackQuery.

2. **Encapsulation of API Interactions**: Services are responsible for encapsulating the APIs that our application interacts with, providing a clean interface for data operations.

3. **Centralized Usage**: Services are meant to be used by components, pages, actions, and hooks throughout the application, promoting code reuse and maintainability.

4. **Error Management**: Errors are handled within the services themselves. They are caught, processed, and re-thrown as user-friendly errors that tanStackQuery can easily manage and display to the user.

## Best Practices

- Keep service functions focused and modular.
- Use TypeScript for strong typing of service inputs and outputs.
- Document each service function with clear JSDoc comments.
- Implement consistent error handling patterns across all services.
- Regularly review and update services to ensure they align with the latest API changes and application requirements.

By adhering to these principles and practices, we maintain a robust and user-friendly service layer in our application.