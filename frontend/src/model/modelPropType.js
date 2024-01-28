import PropTypes from 'prop-types';

export const modelShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  maxTokens: PropTypes.number.isRequired,
  isSupportsVision: PropTypes.bool.isRequired,
  available: PropTypes.bool.isRequired,
  createdTimestamp: PropTypes.instanceOf(Date).isRequired,
  updatedTimestamp: PropTypes.instanceOf(Date).isRequired,
});