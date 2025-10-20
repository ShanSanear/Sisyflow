/// <reference types="astro/client" />

export interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
}

declare global {
  namespace App {
    interface Locals {
      user?: User;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
