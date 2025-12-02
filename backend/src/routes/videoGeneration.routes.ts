import { Router } from 'express';
import { videoGenerationController } from '../controllers/videoGeneration.controller';

const router = Router();

/**
 * @route   POST /api/video/generate
 * @desc    Start video generation job
 * @access  Public (should be protected in production)
 */
router.post('/generate', (req, res) => videoGenerationController.generateVideo(req, res));

/**
 * @route   GET /api/video/status/:jobId
 * @desc    Get video generation job status
 * @access  Public (should be protected in production)
 */
router.get('/status/:jobId', (req, res) => videoGenerationController.getJobStatus(req, res));

/**
 * @route   DELETE /api/video/delete/:filename
 * @desc    Delete video file from server after uploading to Firebase
 * @access  Public (should be protected in production)
 */
router.delete('/delete/:filename', (req, res) => videoGenerationController.deleteVideo(req, res));

export default router;
