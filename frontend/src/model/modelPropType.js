import PropTypes from 'prop-types';

export const modelShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  maxTokens: PropTypes.number,
  isSupportsVision: PropTypes.bool.isRequired,
  available: PropTypes.bool.isRequired,
  createdTimestamp: PropTypes.string,
  updatedTimestamp: PropTypes.string,
});