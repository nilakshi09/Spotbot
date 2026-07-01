export interface ApiKeyItem {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  requestCount: number
  createdAt: string
}

export interface CreateApiKeyResponse {
  id: string
  name: string
  key: string           // Full key — shown ONCE only
  keyPrefix: string
  expiresAt: string | null
  createdAt: string
  warning: string
}
