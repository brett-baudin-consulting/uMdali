import express from "express";
import { logger } from "../logger.mjs";
import userSchema from "../models/UserJoi.mjs";
import { asyncHandler, errorHandler } from "../middlewares/index.mjs";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
} from "../controllers/userController.mjs";

const router = express.Router();

// Middleware  
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    logger.error(`Validation error: ${error.details[0].message}`);
    return errorHandler(res, 400, error.details[0].message);
  }
  next();
};

// Routes  
router.post("/", validateUser, asyncHandler(createUser));
router.get("/", asyncHandler(getAllUsers));
router.get("/:userId", asyncHandler(getUser));
router.put("/:userId", validateUser, asyncHandler(updateUser));
router.delete("/:userId", asyncHandler(deleteUser));

export default router;  