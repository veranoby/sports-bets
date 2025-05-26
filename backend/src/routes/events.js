"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const streamingService_1 = require("../services/streamingService");
const router = (0, express_1.Router)();
// ... otros endpoints existentes ...
// Endpoints de streaming
router.post("/stream/start", streamingService_1.startStreaming);
router.post("/stream/stop", streamingService_1.stopStreaming);
// ... otros endpoints existentes ...
exports.default = router;
