/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_BREVO_SMTP_HOST?: string;
  readonly VITE_BREVO_SMTP_PORT?: string;
  readonly VITE_BREVO_SMTP_USER?: string;
  readonly VITE_BREVO_SMTP_PASSWORD?: string;
  readonly VITE_BREVO_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
