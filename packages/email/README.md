# @repo/email

Email template library built with React Email.

## Overview

Pre-configured email templates using React Email components. Templates are fully typed and support internationalization.

## Usage

```tsx
import { WelcomeEmail } from '@repo/email/emails/welcome'
import { render } from '@repo/email/render'

const html = await render(<WelcomeEmail name="John" />)
```

## Dependency Strategy

This package follows the **Template Library** pattern:

- **Bundled Dependencies**: Template dependencies are bundled (`date-fns`, `@react-email/components`, etc.)
- **Peer Dependencies**: Framework dependencies only (`react`) - consumers control React version
- **Rationale**: Simpler developer experience - install `@repo/email` and it works. Version consistency across all apps using email templates.
