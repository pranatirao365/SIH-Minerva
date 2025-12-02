import { Request, Response } from 'express';
import { videoGenerationService } from '../services/videoGeneration.service';

export class VideoGenerationController {
  /**
   * Start a new video generation job
   * POST /api/video/generate
   */
  async generateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { topic, language } = req.body;

      // Validate input
      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Topic is required and must be a non-empty string',
        });
        return;
      }

      if (!language || !['en', 'hi', 'te'].includes(language)) {
        res.status(400).json({
          success: false,
          error: 'Language must be one of: en, hi, te',
        });
        return;
      }

      // Start video generation
      const jobId = await videoGenerationService.startGeneration(topic, language);

      res.status(202).json({
        success: true,
        jobId,
        message: 'Video generation started',
      });
    } catch (error) {
      console.error('Error starting video generation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start video generation',
      });
    }
  }

  /**
   * Get status of a video generation job
   * GET /api/video/status/:jobId
   */
  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = videoGenerationService.getJobStatus(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        status: job.status,
        currentStage: job.currentStage,
        message: job.message,
        videoUrl: job.videoUrl,
        error: job.error,
      });
    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status',
      });
    }
  }

  /**
   * Delete video file from server after Firebase upload
   * DELETE /api/video/delete/:filename
   */
  async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          error: 'Filename is required',
        });
        return;
      }

      await videoGenerationService.deleteVideoFile(filename);

      res.status(200).json({
        success: true,
        message: 'Video deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete video',
      });
    }
  }
}

export const videoGenerationController = new VideoGenerationController();
