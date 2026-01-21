import { getI18n } from '@repo/email/locales'
import type { NotificationHandler } from '../base'
import type { LoginNotificationInput } from '../schemas'
import { loginNotificationSchema } from '../schemas'

export const loginNotification: NotificationHandler<LoginNotificationInput> = {
  schema: loginNotificationSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: 'login_notification',
    source: 'system',
    priority: 5,
    metadata: {
      timestamp: data.timestamp,
      ipAddress: data.ipAddress,
      location: data.location,
      device: data.device,
      userAgent: data.userAgent,
    },
  }),

  createEmail: (data, user) => {
    const { t } = getI18n({ locale: user?.locale ?? 'en' })

    return {
      template: 'login-notification',
      emailType: 'team',
      subject: t('login-notification.subject'),
      data: {
        timestamp: data.timestamp,
        ipAddress: data.ipAddress,
        location: data.location,
        device: data.device,
        userAgent: data.userAgent,
        fullName: user.full_name,
      },
    }
  },
}
