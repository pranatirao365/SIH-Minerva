import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface VideoGenerationJob {
  jobId: string;
  topic: string;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStage: number;
  message?: string;
  videoUrl?: string;
  error?: string;
  startedAt: Date;
}

// In-memory job storage (use Redis in production)
const jobs = new Map<string, VideoGenerationJob>();

export class VideoGenerationService {
  private pythonPath: string;
  private mainPyPath: string;
  private outputDir: string;

  constructor() {
    // Get the root directory (go up from backend/src/services to project root)
    const rootDir = path.resolve(__dirname, '../../../');
    
    this.pythonPath = 'python'; // Use 'python' or 'python3' based on system
    this.mainPyPath = path.join(rootDir, 'main.py');
    this.outputDir = path.join(rootDir, 'output');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start video generation job
   */
  async startGeneration(topic: string, language: string): Promise<string> {
    const jobId = this.generateJobId();

    const job: VideoGenerationJob = {
      jobId,
      topic,
      language,
      status: 'pending',
      currentStage: 0,
      startedAt: new Date(),
    };

    jobs.set(jobId, job);

    // Start generation in background
    this.executeGeneration(jobId, topic, language);

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): VideoGenerationJob | undefined {
    return jobs.get(jobId);
  }

  /**
   * Execute the Python video generation pipeline
   */
  private async executeGeneration(jobId: string, topic: string, language: string): Promise<void> {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.currentStage = 0;
    job.message = 'Initializing video generation...';

    try {
      console.log(`[${jobId}] Starting video generation...`);
      console.log(`[${jobId}] Topic: ${topic}`);
      console.log(`[${jobId}] Language: ${language}`);

      // Spawn Python process with stdin for interactive input
      const pythonProcess = spawn(this.pythonPath, [this.mainPyPath], {
        cwd: path.dirname(this.mainPyPath),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Get language code for input
      const languageCode = this.getLanguageCode(language);

      // Send automated inputs to Python script
      pythonProcess.stdin.write(`${languageCode}\n`);
      pythonProcess.stdin.write(`${topic}\n`);
      pythonProcess.stdin.end();

      // Collect stdout
      let stdoutData = '';
      pythonProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdoutData += output;
        console.log(`[${jobId}] Output:`, output);
        this.parseProgressOutput(jobId, output);
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data: Buffer) => {
        const errorOutput = data.toString();
        console.error(`[${jobId}] Error output:`, errorOutput);
      });

      // Handle process completion
      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          console.log(`[${jobId}] Completed successfully`);
          this.updateJobCompleted(jobId, stdoutData);
        } else {
          console.error(`[${jobId}] Process exited with code ${code}`);
          this.updateJobError(jobId, `Process exited with code ${code}`);
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error: Error) => {
        console.error(`[${jobId}] Process error:`, error);
        this.updateJobError(jobId, error.message);
      });

    } catch (error) {
      console.error(`[${jobId}] Exception:`, error);
      this.updateJobError(jobId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get language code for Python script
   */
  private getLanguageCode(language: string): string {
    switch (language) {
      case 'en': return '1';
      case 'hi': return '2';
      case 'te': return '3';
      default: return '1';
    }
  }

  /**
   * Parse progress output from Python script
   */
  private parseProgressOutput(jobId: string, output: string): void {
    const job = jobs.get(jobId);
    if (!job) return;

    // Parse stage information from Python output
    if (output.includes('[1/5]') || output.includes('Generating scene breakdown')) {
      job.currentStage = 0;
      job.message = 'Generating scene breakdown...';
    } else if (output.includes('[2/5]') || output.includes('Generating character images')) {
      job.currentStage = 1;
      job.message = 'Generating images...';
    } else if (output.includes('[3/5]') || output.includes('Generating animations')) {
      job.currentStage = 2;
      job.message = 'Creating animations...';
    } else if (output.includes('[4/5]') || output.includes('Generating voiceovers')) {
      job.currentStage = 3;
      job.message = 'Generating voiceovers...';
    } else if (output.includes('[5/5]') || output.includes('Assembling final video')) {
      job.currentStage = 4;
      job.message = 'Assembling final video...';
    }

    jobs.set(jobId, job);
  }

  /**
   * Update job as completed
   */
  private updateJobCompleted(jobId: string, output: string): void {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.currentStage = 5;
    job.message = 'Video generation completed!';

    // Try to find the output video file
    const videoFile = this.findLatestVideo();
    if (videoFile) {
      // Use full URL for mobile app access - return relative URL for frontend conversion
      // Frontend will convert this to absolute URL with correct IP
      job.videoUrl = `/videos/${path.basename(videoFile)}`;
    }

    jobs.set(jobId, job);
  }

  /**
   * Update job as error
   */
  private updateJobError(jobId: string, error: string): void {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'error';
    job.error = error;
    job.message = 'Video generation failed';

    jobs.set(jobId, job);
  }

  /**
   * Find the latest generated video in output directory
   */
  private findLatestVideo(): string | null {
    try {
      if (!fs.existsSync(this.outputDir)) {
        return null;
      }

      const files = fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.mp4'))
        .map(file => ({
          name: file,
          path: path.join(this.outputDir, file),
          time: fs.statSync(path.join(this.outputDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      return files.length > 0 ? files[0].path : null;
    } catch (error) {
      console.error('Error finding latest video:', error);
      return null;
    }
  }

  /**
   * Delete video file from server
   * Called after uploading to Firebase Storage
   */
  async deleteVideoFile(filename: string): Promise<void> {
    try {
      const videoPath = path.join(this.outputDir, filename);
      
      console.log(`🗑️ Deleting video file: ${videoPath}`);
      
      if (!fs.existsSync(videoPath)) {
        console.warn(`⚠️ Video file not found: ${videoPath}`);
        return;
      }

      // Delete the file
      fs.unlinkSync(videoPath);
      console.log(`✅ Video file deleted successfully: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error deleting video file:`, error);
      throw error;
    }
  }

  /**
   * Clean up old jobs (call periodically)
   */
  cleanupOldJobs(maxAgeMs: number = 3600000): void { // Default 1 hour
    const now = new Date().getTime();
    
    for (const [jobId, job] of jobs.entries()) {
      const age = now - job.startedAt.getTime();
      if (age > maxAgeMs && (job.status === 'completed' || job.status === 'error')) {
        jobs.delete(jobId);
        console.log(`Cleaned up job: ${jobId}`);
      }
    }
  }
}

// Export singleton instance
export const videoGenerationService = new VideoGenerationService();
