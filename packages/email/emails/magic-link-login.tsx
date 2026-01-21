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
  magicLink: string
  expirationMinutes?: number
  fullName?: string
  locale?: string
}

export const MagicLinkLoginEmail = ({
  magicLink,
  expirationMinutes = 15,
  fullName = '',
  locale = 'en',
}: Props) => {
  const { t } = getI18n({ locale })
  const firstName = fullName ? fullName.split(' ').at(0) : ''
  const previewText = t('magic-link-login.preview', { firstName })
  const themeClasses = getEmailThemeClasses()
  const lightStyles = getEmailInlineStyles('light')

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
            {t('magic-link-login.heading')}
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {firstName
              ? `${t('magic-link-login.greeting', { firstName })},`
              : t('magic-link-login.greetingFallback')}
            <br />
            <br />
            {t('magic-link-login.description', { expirationMinutes })}
          </Text>

          <br />

          <Section className="text-center mt-[32px] mb-[32px]">
            <Button href={magicLink}>{t('magic-link-login.button')}</Button>
          </Section>

          <Text
            className={`text-xs ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            {t('magic-link-login.securityNotice')}
          </Text>

          <br />
          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  )
}

export default MagicLinkLoginEmail
