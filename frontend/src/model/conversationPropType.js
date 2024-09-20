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
  alias: PropTypes.string,
});

export const conversationShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  conversationId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  messages: PropTypes.arrayOf(messageShape),
  model1: PropTypes.string,
  model2: PropTypes.string,
  contextId1: PropTypes.string,
  contextId2: PropTypes.string,
  alias1: PropTypes.string,
  alias2: PropTypes.string,
  voice1: PropTypes.string,
  voice2: PropTypes.string,
  textToSpeechModelId: PropTypes.string,
  textToSpeechVendor: PropTypes.string,
  isAIConversation: PropTypes.bool,
  createdTimestamp: PropTypes.string.isRequired,
  updatedTimestamp: PropTypes.string.isRequired,
});