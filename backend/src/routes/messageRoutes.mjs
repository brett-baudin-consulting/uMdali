import express from 'express';
import messageController,{ messageAPIs }   from '../controllers/messageController.mjs';

const router = express.Router();

router.post('/', messageController);

router.post('/abort', async (req, res) => {
  const api = req.body.api;
  const messageAPI = messageAPIs[api];
  if (!messageAPI) {
    res.status(400).send({ error: `Unsupported API: ${api}` });
    return;
  }

  if (typeof messageAPI.abortRequest !== 'function') {
    res.status(400).send({ error: `API ${api} does not support aborting requests.` });
    return;
  }

  messageAPI.abortRequest();
  res.send({ message: `Request to API ${api} has been aborted.` });
});

const messageRoutes = router;

export default messageRoutes;