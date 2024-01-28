import { Profanity } from 'profanity-util'; // Assuming Profanity is a named export
import { logger } from '../logger.mjs';

import Filter from './Filter.mjs';

class ProfanityFilter extends Filter {
  constructor(options = { replace: true, map: true }) {
    super();
    this.options = options;
  }

  async process(message) {
    try {
      const result = await Profanity.purifyAsync(message, this.options);
      return result[0];
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
      return message;
    }
  }
}

export default ProfanityFilter;