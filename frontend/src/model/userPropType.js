import PropTypes from 'prop-types';

export const contextShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  contextId: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  isDefault: PropTypes.bool.isRequired,
});

export const settingsShape = PropTypes.shape({
  model: PropTypes.string.isRequired,
  temperature: PropTypes.number.isRequired,
  maxTokens: PropTypes.number.isRequired,
  isStreamResponse: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  contexts: PropTypes.arrayOf(contextShape),
});

export const userShape = PropTypes.shape({
  userId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  settings: settingsShape.isRequired,
});