const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

// Set FFmpeg path if specified in environment
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

class VideoProcessor {
  constructor() {
    this.outputDir = process.env.VIDEO_UPLOAD_PATH || './uploads/videos';
    this.thumbnailDir = process.env.THUMBNAIL_UPLOAD_PATH || './uploads/thumbnails';
  }

  // Get video metadata
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error('Error getting video metadata:', err);
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        const info = {
          duration: Math.floor(metadata.format.duration || 0),
          fileSize: parseInt(metadata.format.size || 0),
          bitRate: parseInt(metadata.format.bit_rate || 0),
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            frameRate: eval(videoStream.r_frame_rate) || 0,
            bitRate: parseInt(videoStream.bit_rate || 0)
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: parseInt(audioStream.sample_rate || 0),
            channels: audioStream.channels,
            bitRate: parseInt(audioStream.bit_rate || 0)
          } : null
        };

        resolve(info);
      });
    });
  }

  // Generate video thumbnail
  async generateThumbnail(videoPath, outputPath = null, timeOffset = '00:00:05') {
    const thumbnailPath = outputPath || path.join(
      this.thumbnailDir, 
      `thumb-${uuidv4()}-${Date.now()}.jpg`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '1280x720'
        })
        .on('end', () => {
          logger.info(`Thumbnail generated: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          logger.error('Error generating thumbnail:', err);
          reject(err);
        });
    });
  }

  // Generate multiple thumbnails at different timestamps
  async generateMultipleThumbnails(videoPath, count = 3) {
    const info = await this.getVideoInfo(videoPath);
    const duration = info.duration;
    const interval = Math.floor(duration / (count + 1));
    
    const thumbnails = [];
    const promises = [];

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const timeString = this.secondsToTimeString(timestamp);
      const thumbnailPath = path.join(
        this.thumbnailDir,
        `thumb-${uuidv4()}-${Date.now()}-${i}.jpg`
      );

      promises.push(
        this.generateThumbnail(videoPath, thumbnailPath, timeString)
          .then(path => {
            thumbnails.push({
              path,
              timestamp,
              timeString
            });
          })
      );
    }

    await Promise.all(promises);
    return thumbnails.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Convert video to different qualities
  async transcodeVideo(inputPath, quality = '720p') {
    const outputPath = path.join(
      this.outputDir,
      `${path.parse(inputPath).name}-${quality}-${Date.now()}.mp4`
    );

    const qualitySettings = {
      '240p': { width: 426, height: 240, bitrate: '400k' },
      '360p': { width: 640, height: 360, bitrate: '800k' },
      '480p': { width: 854, height: 480, bitrate: '1200k' },
      '720p': { width: 1280, height: 720, bitrate: '2500k' },
      '1080p': { width: 1920, height: 1080, bitrate: '5000k' }
    };

    const settings = qualitySettings[quality];
    if (!settings) {
      throw new Error(`Unsupported quality: ${quality}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${settings.width}x${settings.height}`)
        .videoBitrate(settings.bitrate)
        .audioBitrate('128k')
        .format('mp4')
        .on('start', (commandLine) => {
          logger.info(`Transcoding started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Transcoding progress: ${progress.percent}%`);
        })
        .on('end', () => {
          logger.info(`Transcoding completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('Transcoding error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Process video for multiple qualities
  async processVideoMultiQuality(inputPath, qualities = ['360p', '720p']) {
    const results = {
      original: inputPath,
      info: await this.getVideoInfo(inputPath),
      qualities: {},
      thumbnails: []
    };

    try {
      // Generate thumbnails
      results.thumbnails = await this.generateMultipleThumbnails(inputPath);

      // Transcode to different qualities
      const transcodePromises = qualities.map(async (quality) => {
        try {
          const outputPath = await this.transcodeVideo(inputPath, quality);
          results.qualities[quality] = outputPath;
          logger.info(`Successfully transcoded to ${quality}: ${outputPath}`);
        } catch (error) {
          logger.error(`Failed to transcode to ${quality}:`, error);
          results.qualities[quality] = null;
        }
      });

      await Promise.all(transcodePromises);

      logger.info(`Video processing completed for: ${inputPath}`);
      return results;
    } catch (error) {
      logger.error('Video processing failed:', error);
      throw error;
    }
  }

  // Extract audio from video
  async extractAudio(videoPath, outputPath = null) {
    const audioPath = outputPath || path.join(
      this.outputDir,
      `audio-${uuidv4()}-${Date.now()}.mp3`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .noVideo()
        .audioCodec('mp3')
        .audioBitrate('192k')
        .on('end', () => {
          logger.info(`Audio extracted: ${audioPath}`);
          resolve(audioPath);
        })
        .on('error', (err) => {
          logger.error('Audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Validate video file
  async validateVideo(videoPath) {
    try {
      const info = await this.getVideoInfo(videoPath);
      
      const validations = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Check if video stream exists
      if (!info.video) {
        validations.isValid = false;
        validations.errors.push('No video stream found');
      }

      // Check duration
      if (info.duration <= 0) {
        validations.isValid = false;
        validations.errors.push('Invalid video duration');
      }

      // Check file size
      if (info.fileSize <= 0) {
        validations.isValid = false;
        validations.errors.push('Invalid file size');
      }

      // Warnings for quality issues
      if (info.video && info.video.width < 640) {
        validations.warnings.push('Video resolution is quite low');
      }

      if (info.duration > 3600) { // 1 hour
        validations.warnings.push('Video is longer than 1 hour');
      }

      return validations;
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to read video file'],
        warnings: []
      };
    }
  }

  // Helper method to convert seconds to time string
  secondsToTimeString(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Clean up temporary files
  async cleanup(filePaths) {
    const promises = filePaths.map(filePath => {
      return new Promise((resolve) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Failed to delete file: ${filePath}`, err);
          } else {
            logger.info(`Cleaned up file: ${filePath}`);
          }
          resolve();
        });
      });
    });

    await Promise.all(promises);
  }
}

module.exports = new VideoProcessor();
