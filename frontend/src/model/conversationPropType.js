import PropTypes from 'prop-types';

export const fileShape = PropTypes.shape({
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  originalName: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  uploadedAt: PropTypes.string,
});

export const messageShape = PropTypes.shape({
  content: PropTypes.string,
  role: PropTypes.string.isRequired,
  messageId: PropTypes.string.isRequired,
  modelName: PropTypes.string,
  files: PropTypes.arrayOf(fileShape),
});

export const conversationShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  conversationId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  messages: PropTypes.arrayOf(messageShape),
});