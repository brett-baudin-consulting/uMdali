import express from "express";
import DataImportModelService from "../services/dataImportModelService.mjs";
import { asyncHandler } from "../middlewares/index.mjs";

const router = express.Router();

// Routes  
router.get("/", asyncHandler(async (req, res) => {
  const dataImports = await DataImportModelService.getAllDataImports();
  res.json({ success: true, data: dataImports });
}));

export default router;  