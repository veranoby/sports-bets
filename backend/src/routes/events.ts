import { Router } from "express";
import { startStreaming, stopStreaming } from "../services/streamingService";

const router = Router();

// ... otros endpoints existentes ...

// Endpoints de streaming
router.post("/stream/start", startStreaming);
router.post("/stream/stop", stopStreaming);

// ... otros endpoints existentes ...

export default router;
