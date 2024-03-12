import PropTypes from 'prop-types';

export const textToSpeechModelShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  available: PropTypes.bool.isRequired,
  createdTimestamp: PropTypes.instanceOf(Date).isRequired,
  updatedTimestamp: PropTypes.instanceOf(Date).isRequired,
});