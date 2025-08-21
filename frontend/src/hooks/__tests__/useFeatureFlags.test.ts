import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFeatureFlags } from '../useFeatureFlags'

// Mock import.meta.env
const mockImportMeta = {
  env: {}
}

vi.stubGlobal('import', {
  meta: mockImportMeta
})

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    mockImportMeta.env = {}
  })

  it('should return false for betting when VITE_FEATURES_BETTING is not set', () => {
    const flags = useFeatureFlags()
    expect(flags.isBettingEnabled).toBe(false)
  })

  it('should return false for wallet when VITE_FEATURES_WALLET is not set', () => {
    const flags = useFeatureFlags()
    expect(flags.isWalletEnabled).toBe(false)
  })

  it('should return true for betting when VITE_FEATURES_BETTING is "true"', () => {
    mockImportMeta.env.VITE_FEATURES_BETTING = 'true'
    const flags = useFeatureFlags()
    expect(flags.isBettingEnabled).toBe(true)
  })

  it('should return true for wallet when VITE_FEATURES_WALLET is "true"', () => {
    mockImportMeta.env.VITE_FEATURES_WALLET = 'true'
    const flags = useFeatureFlags()
    expect(flags.isWalletEnabled).toBe(true)
  })

  it('should return false for betting when VITE_FEATURES_BETTING is "false"', () => {
    mockImportMeta.env.VITE_FEATURES_BETTING = 'false'
    const flags = useFeatureFlags()
    expect(flags.isBettingEnabled).toBe(false)
  })

  it('should return false for wallet when VITE_FEATURES_WALLET is "false"', () => {
    mockImportMeta.env.VITE_FEATURES_WALLET = 'false'
    const flags = useFeatureFlags()
    expect(flags.isWalletEnabled).toBe(false)
  })

  it('should return both flags correctly when both are enabled', () => {
    mockImportMeta.env.VITE_FEATURES_BETTING = 'true'
    mockImportMeta.env.VITE_FEATURES_WALLET = 'true'
    const flags = useFeatureFlags()
    expect(flags.isBettingEnabled).toBe(true)
    expect(flags.isWalletEnabled).toBe(true)
  })

  it('should handle string values other than "true" as false', () => {
    mockImportMeta.env.VITE_FEATURES_BETTING = 'yes'
    mockImportMeta.env.VITE_FEATURES_WALLET = '1'
    const flags = useFeatureFlags()
    expect(flags.isBettingEnabled).toBe(false)
    expect(flags.isWalletEnabled).toBe(false)
  })
})