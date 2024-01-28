import express from "express";
import Joi from "joi";

import User from "../models/User.mjs";
import { logger } from "../logger.mjs";

const router = express.Router();

// Joi validation schema for creating/updating a user
const userSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().required(),
  settings: Joi.object({
    model: Joi.string().required(),
    temperature: Joi.number().default(0.5),
    maxTokens: Joi.number().default(1000),
    contexts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        contextId: Joi.string().required(),
        text: Joi.string().required(),
        isDefault: Joi.boolean().default(false),
      }).unknown()
    ),
  }).required().unknown(),
}).unknown();

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    logger.error(error);
    return res.status(400).send(error.details[0].message);
  }
  next();
};

// PUT route to update a user by userId
router.put("/:userId", validate(userSchema), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, overwrite: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    logger.error(error);
    res.status(400).send(error);
  }
});

// POST route to create a new user
router.post("/", validate(userSchema), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    logger.error(error);
    res.status(400).send(error);
  }
});

// GET route to fetch a user by userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

// GET route to fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

// DELETE route to delete a user by userId
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.userId });
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

export default router;
