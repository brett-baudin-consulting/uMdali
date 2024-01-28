import { SyncRedactor } from 'redact-pii';

import { logger } from '../logger.mjs';
import Filter from './Filter.mjs';

class PiiFilter extends Filter {
  constructor() {
    super();
    this.redactor = new SyncRedactor();
  }

  process(message) {
    try {
      return this.redactor.redact(message);
    } catch (error) {
      logger.error('Error redacting PII:', error);
      throw error;
    }
  }
}

export default PiiFilter;