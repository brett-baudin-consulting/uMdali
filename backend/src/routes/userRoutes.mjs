import express from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";

import User from "../models/User.mjs";
import { logger } from "../logger.mjs";

const router = express.Router();

// Joi validation schema for creating/updating a user
const MacroSchema = Joi.object({
  shortcut: Joi.string().required(),
  text: Joi.string().required(),
  macroId: Joi.string().required(),
});

const ContextSchema = Joi.object({
  name: Joi.string().required(),
  contextId: Joi.string().required(),
  text: Joi.string().required(),
  isDefault: Joi.boolean().default(false),
});

const SpeechToTextModelSchema = Joi.object({
  model_id: Joi.string().required(),
  vendor: Joi.string().required(),
});

const TextToSpeechModelSchema = Joi.object({
  model_id: Joi.string().required(),
  vendor: Joi.string().required(),
  voice_id: Joi.string().required(),
});

const SettingsSchema = Joi.object({
  model: Joi.string().required(),
  speechToTextModel: SpeechToTextModelSchema.required(),
  textToSpeechModel: TextToSpeechModelSchema.required(),
  temperature: Joi.number().default(0.5),
  maxTokens: Joi.number().default(1000),
  isStreamResponse: Joi.boolean().default(true),
  theme: Joi.string().default('dark'),
  contexts: Joi.array().items(ContextSchema),
  macros: Joi.array().items(MacroSchema),
});

const userSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().required(),
  settings: SettingsSchema.required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false }); // Disable abortEarly to get all errors
  if (error) {
    logger.error(error);
    const errors = error.details.map(detail => detail.message);
    return res.status(StatusCodes.BAD_REQUEST).json({ errors });
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
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    res.send(user);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.BAD_REQUEST).send(error);
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
    res.status(StatusCodes.BAD_REQUEST).send(error);
  }
});

const cleanObject = (obj) => {
  obj = obj.toObject ? obj.toObject({
    versionKey: false, transform: (doc, ret) => {
      Object.keys(ret).forEach(key => {
        if (key.startsWith('_')) {
          delete ret[key];
        } else if (typeof ret[key] === 'object' && ret[key] !== null) {
          ret[key] = cleanObject(ret[key]);
        }
      });
    }
  }) : obj;
  return obj;
};

// GET route to fetch a user by userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    // Clean the user object before sending it
    const sanitizedUser = cleanObject(user);
    res.send(sanitizedUser);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

// GET route to fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

// DELETE route to delete a user by userId
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.userId });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    res.send(user);
  } catch (error) {
    logger.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

export default router;
