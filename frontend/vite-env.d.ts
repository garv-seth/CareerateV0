/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_AD_B2C_TENANT_NAME: string
  readonly VITE_AZURE_AD_B2C_CLIENT_ID: string
  readonly VITE_AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY: string
  readonly VITE_AZURE_AD_B2C_PASSWORD_RESET_POLICY: string
  readonly VITE_AZURE_AD_B2C_PROFILE_EDIT_POLICY: string
  readonly VITE_AZURE_AD_B2C_CUSTOM_DOMAIN: string
  readonly VITE_AZURE_AD_B2C_TENANT_ID_OVERRIDE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 