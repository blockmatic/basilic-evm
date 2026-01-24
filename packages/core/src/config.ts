export type CoreClientOptions = {
  baseUrl: string
  getAuthToken?: () => string | null | Promise<string | null>
  getRefreshToken?: () => string | null | Promise<string | null>
  onTokensRefreshed?: (tokens: { token: string; refreshToken: string }) => void | Promise<void>
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>
}
