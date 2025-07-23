/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BEAD151_CARD_CONTRACT: string
  readonly VITE_BEAD151_CARD_ART_CONTRACT: string
  readonly VITE_BEAD151_CANDY_CONTRACT: string
  readonly VITE_BEAD151_CHARACTER_STATS_CONTRACT: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}