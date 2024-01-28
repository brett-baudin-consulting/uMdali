/**
 * Abstract class representing a filter.
 * Subclasses should implement the `process` method to define custom filtering logic.
 */
class Filter {
    /**
     * Processes a message. Subclasses must override this method.
     * @param {string} message - The message to be processed.
     * @throws Will throw an error if the method is not implemented.
     */
    process(message) {
        throw new Error('You have to implement the method process!');
    }
}

export default Filter;