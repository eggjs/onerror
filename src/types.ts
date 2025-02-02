import type {
  OnerrorConfig,
} from './config/config.default.js';

export type { OnerrorConfig };

declare module '@eggjs/core' {
  // add EggAppConfig overrides types
  interface EggAppConfig {
    onerror: OnerrorConfig;
  }
}
