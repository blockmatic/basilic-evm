import { Body, Container, Heading, Preview, Section, Text } from '@react-email/components'
import { Footer } from '../components/footer'
import { Logo } from '../components/logo'
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from '../components/theme'
import { getI18n } from '../locales'

interface Props {
  timestamp: string
  ipAddress: string
  location?: string
  device?: string
  userAgent?: string
  fullName?: string
  locale?: string
  secureAccountUrl?: string
  thisWasMeUrl?: string
}

export const LoginNotificationEmail = ({
  timestamp,
  ipAddress,
  location,
  device,
  userAgent: _userAgent,
  fullName = '',
  locale = 'en',
  secureAccountUrl,
  thisWasMeUrl,
}: Props) => {
  const { t } = getI18n({ locale })
  const firstName = fullName ? fullName.split(' ').at(0) : ''
  const previewText = t('login-notification.preview', { firstName })
  const themeClasses = getEmailThemeClasses()
  const lightStyles = getEmailInlineStyles('light')

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(locale, {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    } catch {
      return dateString
    }
  }

  return (
    <EmailThemeProvider preview={<Preview>{previewText}</Preview>}>
      <Body className={`my-auto mx-auto font-sans ${themeClasses.body}`} style={lightStyles.body}>
        <Container
          className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
          style={{
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: lightStyles.container.borderColor,
          }}
        >
          <Logo />
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            {t('login-notification.heading')}
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName
              ? `${t('login-notification.greeting', { firstName })},`
              : t('login-notification.greetingFallback')}
            <br />
            <br />
            {t('login-notification.description')}
          </Text>

          <br />

          <Section
            className={`border border-solid ${themeClasses.border}`}
            style={{
              borderColor: lightStyles.container.borderColor,
              padding: '16px',
              borderRadius: '4px',
            }}
          >
            <Text
              className={`text-[14px] mb-2 ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>{t('login-notification.time')}:</strong> {formatDate(timestamp)}
            </Text>
            <Text
              className={`text-[14px] mb-2 ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>{t('login-notification.ipAddress')}:</strong> {ipAddress}
            </Text>
            {location && (
              <Text
                className={`text-[14px] mb-2 ${themeClasses.text}`}
                style={{ color: lightStyles.text.color }}
              >
                <strong>{t('login-notification.location')}:</strong> {location}
              </Text>
            )}
            {device && (
              <Text
                className={`text-[14px] mb-2 ${themeClasses.text}`}
                style={{ color: lightStyles.text.color }}
              >
                <strong>{t('login-notification.device')}:</strong> {device}
              </Text>
            )}
          </Section>

          <br />

          {secureAccountUrl && (
            <Text
              className={`text-[14px] leading-[24px] ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              {t('login-notification.securityMessage')}
            </Text>
          )}

          <br />

          <Section className="text-center mt-[32px] mb-[32px]">
            {thisWasMeUrl && (
              <Button href={thisWasMeUrl} variant="secondary" className="mr-2">
                {t('login-notification.thisWasMe')}
              </Button>
            )}
            {secureAccountUrl && (
              <Button href={secureAccountUrl}>{t('login-notification.secureAccount')}</Button>
            )}
          </Section>

          <br />
          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  )
}

export default LoginNotificationEmail
