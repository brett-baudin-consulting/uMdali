import PropTypes from 'prop-types';
const voiceShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
});
export const textToSpeechModelShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  available: PropTypes.bool.isRequired,
  voices: PropTypes.arrayOf(voiceShape).isRequired,
  createdTimestamp: PropTypes.string.isRequired,
  updatedTimestamp: PropTypes.string.isRequired,
});