import PropTypes from 'prop-types';

export const speechToTextModelShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  vendor: PropTypes.string.isRequired,
  available: PropTypes.bool.isRequired,
  createdTimestamp: PropTypes.string.isRequired,
  updatedTimestamp: PropTypes.string.isRequired,
});