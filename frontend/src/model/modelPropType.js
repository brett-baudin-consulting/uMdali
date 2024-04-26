import PropTypes from 'prop-types';

export const modelShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  isSupportsVision: PropTypes.bool.isRequired,
  isSupportsAudio: PropTypes.bool.isRequired,
  isSupportsVideo: PropTypes.bool.isRequired,
  isSupportsContext: PropTypes.bool.isRequired,
  isSupportsStreaming: PropTypes.bool.isRequired,
  inputTokenLimit: PropTypes.number.isRequired,
  outputTokenLimit: PropTypes.number.isRequired,
  available: PropTypes.bool.isRequired,
  createdTimestamp: PropTypes.string,
  updatedTimestamp: PropTypes.string,
});