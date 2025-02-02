import type { ILifecycleBoot, EggCore } from '@eggjs/core';

export default class Boot implements ILifecycleBoot {
  constructor(private agent: EggCore) {}

  async didLoad() {
    // should watch error event
    this.agent.on('error', err => {
      this.agent.coreLogger.error(err);
    });
  }
}
