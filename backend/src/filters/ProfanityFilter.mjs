import { profanity } from '@2toad/profanity'; // Assuming Profanity is a named export and supports ESM
import { logger } from '../logger.mjs';

import Filter from './Filter.mjs';

class ProfanityFilter extends Filter {
  
  async process(message) {
    try {
      const result = profanity.censor(message);
      return result;
    } catch (error) {
      // Log the entire error object for more context
      logger.error(`ProfanityFilter Error processing message:`, error);
      return message;
    }
  }
}

export default ProfanityFilter;