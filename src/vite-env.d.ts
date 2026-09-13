/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 自托管 VOICEVOX 引擎的地址；留空则只用系统语音 */
  readonly VITE_VOICEVOX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
