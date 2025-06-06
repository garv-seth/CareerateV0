/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_B2C_CLIENT_ID: string;
  readonly VITE_B2C_TENANT_NAME: string;
  readonly VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME: string;
  readonly VITE_NODE_ENV: string;
  readonly VITE_CORS_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 