import express from "express";
import userService from "../services/userService.mjs";
import { logger } from "../logger.mjs";
import userSchema from "../models/UserJoi.mjs";
import { asyncHandler, errorResponse } from "../middlewares/index.mjs";

const router = express.Router();

// Middleware  
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    logger.error(`Validation error: ${error.details[0].message}`);
    return errorResponse(res, 400, error.details[0].message);
  }
  next();
};

// Routes  
router.post("/", validateUser, asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
}));

router.get("/", asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json({ success: true, data: users });
}));

router.get("/:userId", asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.userId);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }
  res.json({ success: true, data: user });
}));

router.put("/:userId", validateUser, asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }
  res.json({ success: true, data: user });
}));

router.delete("/:userId", asyncHandler(async (req, res) => {
  const user = await userService.deleteUser(req.params.userId);
  if (!user) {
    return errorResponse(res, 404, "User not found");
  }
  res.sendStatus(204);
}));

export default router;  