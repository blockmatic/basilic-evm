# @repo/notif

Notification service library for sending notifications across different channels.

## Overview

Provides a unified notification service with support for email notifications. Includes type-safe notification schemas and service implementations.

## Usage

```ts
import { Notifications } from '@repo/notif'

const service = new Notifications()

await service.create('login_notification', {
  users: [
    {
      id: 'user-uuid',
      full_name: 'John Doe',
      email: 'john@example.com',
      team_id: 'team-uuid',
    },
  ],
  timestamp: new Date().toISOString(),
  ipAddress: '192.168.1.1',
  location: 'San Francisco, CA',
  device: 'Chrome on Windows',
  userAgent: 'Mozilla/5.0...',
})
```

## Dependency Strategy

This package follows the **Service Library** pattern:

- **Bundled Dependencies**: Tightly-coupled dependencies (`zod` for schemas, `nanoid`, `resend`)
- **Peer Dependencies**: Configuration/environment dependencies (`@t3-oss/env-core`) - environment setup is consumer's responsibility
- **Rationale**: Internal schemas should be bundled for simplicity. Environment configuration is consumer's responsibility. Service implementation is self-contained.
