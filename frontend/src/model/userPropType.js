import PropTypes from 'prop-types';

export const macroShape = PropTypes.shape({
  shortcut: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  macroId: PropTypes.string.isRequired,
});

export const contextShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  contextId: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  isDefault: PropTypes.bool,
});
export const textToSpeechShape = PropTypes.shape({
  model_id: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  voice_id: PropTypes.string.isRequired,
});
export const speechToTextShape = PropTypes.shape({
  model_id: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
});
export const settingsShape = PropTypes.shape({
  model: PropTypes.string.isRequired,
  temperature: PropTypes.number.isRequired,
  maxTokens: PropTypes.number.isRequired,
  isStreamResponse: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  contexts: PropTypes.arrayOf(contextShape),
  macros: PropTypes.arrayOf(macroShape),
  speechToTextModel: speechToTextShape.isRequired,
  textToSpeechModel: textToSpeechShape.isRequired,
});

export const userShape = PropTypes.shape({
  userId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  settings: settingsShape.isRequired,
});