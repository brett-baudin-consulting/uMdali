import Filter from './Filter.mjs';

// This is a basic credit card filter
class CreditCardFilter extends Filter {

  process(message) {
    // Improved regex to match credit card numbers with variable spacing and separators
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    return message.replace(creditCardRegex, (match) => {
      // Replace only the digits, keeping the separators intact
      return match.replace(/\d/g, '*');
    });
  }
}

export default CreditCardFilter;