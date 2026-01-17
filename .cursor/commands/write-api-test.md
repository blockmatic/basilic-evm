# Write API Tests

## Overview

Create comprehensive tests for API endpoints that validate behavior through external interactions rather than internal implementation. All tests use real services with real credentials - NO MOCKS allowed for core functionality.

## Testing Philosophy

**CRITICAL**: All tests use real APIs with real credentials. NO MOCKS allowed for core functionality.

- Test endpoints through their public interface, not internal code
- Validate responses against defined contracts
- Use actual credentials from environment variables
- Focus on external behavior, never internal implementation

## Steps

1. **Test Structure**
   - Follow project conventions for test file naming
   - Set up proper test lifecycle management
   - Use appropriate utilities to simulate requests
   - Test through public interfaces only

2. **Test Coverage**
   - All operations (create, read, update, delete)
   - Error handling and validation scenarios
   - Response validation against contracts
   - Authentication and authorization
   - Input validation

3. **Test Pattern**
   - Simulate requests through testing utilities
   - Test external behavior, not internal code
   - Validate response codes
   - Validate response structure matches contracts
   - Test both success and failure scenarios

4. **Response Validation**
   - Parse and validate responses
   - Use appropriate assertion methods
   - Validate against defined contracts
   - Test structure, not implementation

## Checklist

- [ ] Created test file with appropriate naming
- [ ] Set up proper test lifecycle
- [ ] Used appropriate testing utilities for requests
- [ ] Tested all core operations
- [ ] Tested error handling and validation
- [ ] Validated response codes
- [ ] Validated response structure matches contracts
- [ ] Tested authentication/authorization
- [ ] Tested input validation
- [ ] No mocks used for core functionality
- [ ] Tests use real services with real credentials
- [ ] Tests focus on external behavior only

## What NOT to Do

- ❌ Don't test internal implementation
- ❌ Don't mock core functionality
- ❌ Don't test implementation details
- ❌ Don't import and test internal functions directly
- ❌ Don't use console logging
