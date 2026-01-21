import { type TranslationParams, type Translations, translations } from './translations'

type Options = {
  locale?: string
}

const supportedLocales = ['en', 'sv'] as const

type SupportedLocale = (typeof supportedLocales)[number]

export function getI18n({ locale = 'en' }: Options) {
  // Ensure locale is supported, fallback to English if not
  const safeLocale: SupportedLocale = supportedLocales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : 'en'

  // Get translations for the locale
  const getTranslation = (key: string, params?: TranslationParams): string => {
    const translationSet = translations(safeLocale, params)

    if (!translationSet || !(key in translationSet)) {
      return key // Fallback to key if translation missing
    }

    return translationSet[key as keyof Translations] ?? key
  }

  return {
    t: getTranslation,
  }
}
