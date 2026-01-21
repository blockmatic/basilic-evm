export interface TranslationParams {
  [key: string]: string | number | undefined
}

export type Translations = {
  'notifications.match': string
  'notifications.transactions': string
  'transactions.subject': string
  'transactions.preview': string
  'transactions.title1': string
  'transactions.title2': string
  'transactions.description1': string
  'transactions.description2': string
  'transactions.description3': string
  'transactions.description4': string
  'transactions.button': string
  'transactions.footer': string
  'transactions.settings': string
  'transactions.amount': string
  'transactions.date': string
  'transactions.description': string
  'magic-link-login.subject': string
  'magic-link-login.preview': string
  'magic-link-login.heading': string
  'magic-link-login.greeting': string
  'magic-link-login.greetingFallback': string
  'magic-link-login.description': string
  'magic-link-login.button': string
  'magic-link-login.securityNotice': string
  'login-notification.subject': string
  'login-notification.preview': string
  'login-notification.heading': string
  'login-notification.greeting': string
  'login-notification.greetingFallback': string
  'login-notification.description': string
  'login-notification.time': string
  'login-notification.ipAddress': string
  'login-notification.location': string
  'login-notification.device': string
  'login-notification.securityMessage': string
  'login-notification.thisWasMe': string
  'login-notification.secureAccount': string
}

export function translations(locale: string, params?: TranslationParams): Translations | undefined {
  // Normalize pluralization logic
  const count = typeof params?.numberOfTransactions === 'number' ? params.numberOfTransactions : 1
  const plural = count > 1

  switch (locale) {
    case 'en':
      return {
        'notifications.match': `We matched the transaction "${params?.transactionName}" against "${params?.fileName}"`,
        'notifications.transactions':
          count > 1
            ? `You have ${count} new transactions`
            : `You have a new transaction of ${params?.amount} from ${params?.name}`,
        'transactions.subject': 'New transactions',
        'transactions.preview': `${params?.firstName ? `Hi ${params?.firstName}, ` : ''}You have ${count} ${plural ? 'new transactions' : 'new transaction'}`,
        'transactions.title1': 'You have ',
        'transactions.title2': `${count} ${plural ? 'new transactions' : 'new transaction'}`,
        'transactions.description1': `${params?.firstName ? `Hi ${params?.firstName}` : 'Hello'}`,
        'transactions.description2': 'We found',
        'transactions.description3': `${count} ${plural ? 'new transactions' : 'new transaction'}`,
        'transactions.description4': `${params?.teamName ? `for your team ${params?.teamName}` : 'for your account'}. We'll automatically match them against receipts in your inbox, or you can simply reply to this email with the receipts.`,
        'transactions.button': 'View transactions',
        'transactions.footer':
          ' Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum nisl, sed faucibus neque. Donec lacus mi, rhoncus at dictum eget, pulvinar at metus. Donec cursus tellus erat, a hendrerit elit rutrum ut. Fusce quis tristique ligula. Etiam sit amet enim vitae mauris auctor blandit id et nibh.',
        'transactions.settings': 'Notification preferences',
        'transactions.amount': 'Amount',
        'transactions.date': 'Date',
        'transactions.description': 'Description',
        'magic-link-login.subject': 'Sign in to your account',
        'magic-link-login.preview': `${params?.firstName ? `Hi ${params?.firstName}, ` : ''}Sign in to your account`,
        'magic-link-login.heading': 'Sign in to your account',
        'magic-link-login.greeting': `Hi ${params?.firstName}`,
        'magic-link-login.greetingFallback': 'Hello',
        'magic-link-login.description': `Click the button below to sign in. This link will expire in ${params?.expirationMinutes || 15} minutes.`,
        'magic-link-login.button': 'Sign in',
        'magic-link-login.securityNotice':
          "If you didn't request this link, you can safely ignore this email.",
        'login-notification.subject': 'New sign-in detected',
        'login-notification.preview': `${params?.firstName ? `Hi ${params?.firstName}, ` : ''}New sign-in detected`,
        'login-notification.heading': 'New sign-in detected',
        'login-notification.greeting': `Hi ${params?.firstName}`,
        'login-notification.greetingFallback': 'Hello',
        'login-notification.description': 'We noticed a new sign-in to your account',
        'login-notification.time': 'Time',
        'login-notification.ipAddress': 'IP Address',
        'login-notification.location': 'Location',
        'login-notification.device': 'Device',
        'login-notification.securityMessage': "If this wasn't you, secure your account immediately",
        'login-notification.thisWasMe': 'This was me',
        'login-notification.secureAccount': 'Secure account',
      }
    case 'sv':
      return {
        'notifications.match': `Vi matchade transaktionen "${params?.transactionName}" mot "${params?.fileName}"`,
        'notifications.transactions':
          count > 1
            ? `Du har ${count} nya transaktioner`
            : `Du har en ny transaktion på ${params?.amount} från ${params?.name}`,
        'transactions.subject': 'Nya transaktioner',
        'transactions.preview': `${params?.firstName ? `Hej ${params?.firstName}, ` : ''}Vi hittade ${count} ${plural ? 'nya transaktioner' : 'nya transaktion'}.`,
        'transactions.title1': 'Du har ',
        'transactions.title2': `${count} ${plural ? 'nya transaktioner' : 'nya transaktion'}`,
        'transactions.description1': `${params?.firstName ? `Hej ${params?.firstName}` : 'Hej'}`,
        'transactions.description2': 'Vi hittade',
        'transactions.description3': `${count} ${plural ? 'nya transaktioner' : 'nya transaktion'}`,
        'transactions.description4': `${params?.teamName ? `för ditt team ${params?.teamName}` : 'på ditt konto'}. Vi matchar dem automatiskt mot kvitton i din inkorg, eller så kan du svara på detta email med dina kvitton.`,
        'transactions.button': 'Visa transaktioner',
        'transactions.footer':
          ' Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum nisl, sed faucibus neque. Donec lacus mi, rhoncus at dictum eget, pulvinar at metus. Donec cursus tellus erat, a hendrerit elit rutrum ut. Fusce quis tristique ligula. Etiam sit amet enim vitae mauris auctor blandit id et nibh.',
        'transactions.settings': 'Inställningar',
        'transactions.amount': 'Belopp',
        'transactions.date': 'Datum',
        'transactions.description': 'Beskrivning',
        'magic-link-login.subject': 'Logga in på ditt konto',
        'magic-link-login.preview': `${params?.firstName ? `Hej ${params?.firstName}, ` : ''}Logga in på ditt konto`,
        'magic-link-login.heading': 'Logga in på ditt konto',
        'magic-link-login.greeting': `Hej ${params?.firstName}`,
        'magic-link-login.greetingFallback': 'Hej',
        'magic-link-login.description': `Klicka på knappen nedan för att logga in. Denna länk kommer att upphöra om ${params?.expirationMinutes || 15} minuter.`,
        'magic-link-login.button': 'Logga in',
        'magic-link-login.securityNotice':
          'Om du inte begärde denna länk kan du säkert ignorera detta e-postmeddelande.',
        'login-notification.subject': 'Ny inloggning upptäckt',
        'login-notification.preview': `${params?.firstName ? `Hej ${params?.firstName}, ` : ''}Ny inloggning upptäckt`,
        'login-notification.heading': 'Ny inloggning upptäckt',
        'login-notification.greeting': `Hej ${params?.firstName}`,
        'login-notification.greetingFallback': 'Hej',
        'login-notification.description': 'Vi upptäckte en ny inloggning till ditt konto',
        'login-notification.time': 'Tid',
        'login-notification.ipAddress': 'IP-adress',
        'login-notification.location': 'Plats',
        'login-notification.device': 'Enhet',
        'login-notification.securityMessage': 'Om detta inte var du, säkra ditt konto omedelbart',
        'login-notification.thisWasMe': 'Det var jag',
        'login-notification.secureAccount': 'Säkra kontot',
      }

    default:
      return undefined
  }
}
