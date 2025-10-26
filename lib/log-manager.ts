import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

export interface LogFlushOptions {
  days?: number;
  before?: string;
  all?: boolean;
  dryRun?: boolean;
}

export interface LogStats {
  fileCount: number;
  totalSizeMB: number;
  oldestFile?: string;
  newestFile?: string;
  files: Array<{
    name: string;
    size: number;
    created: Date;
    modified: Date;
  }>;
}

export interface LogCleanOptions {
  maxFiles?: number;
  maxSizeMB?: number;
  maxAgeDays?: number;
  compressionEnabled?: boolean;
  archiveOldLogs?: boolean;
}

export class LogManager {
  private static DEFAULT_LOG_DIR = 'logs';

  /**
   * Flush/rotate log files based on criteria
   */
  static async flushLogs(options: LogFlushOptions = {}): Promise<string[]> {
    const logDir = this.DEFAULT_LOG_DIR;
    const flushedFiles: string[] = [];

    try {
      // Check if log directory exists
      await fs.access(logDir);
    } catch {
      return []; // No logs directory, nothing to flush
    }

    const files = await fs.readdir(logDir);
    const logFiles = files.filter(file => file.endsWith('.log') && file.includes('puremix-'));

    for (const file of logFiles) {
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      const shouldFlush = this.shouldFlushFile(file, stats, options);

      if (shouldFlush) {
        if (options.dryRun) {
          flushedFiles.push(`[DRY RUN] Would flush: ${file}`);
        } else {
          await fs.unlink(filePath);
          flushedFiles.push(`Flushed: ${file}`);
        }
      }
    }

    return flushedFiles;
  }

  /**
   * Get comprehensive log statistics
   */
  static async getLogStats(): Promise<LogStats> {
    const logDir = this.DEFAULT_LOG_DIR;
    const stats: LogStats = {
      fileCount: 0,
      totalSizeMB: 0,
      files: []
    };

    try {
      await fs.access(logDir);
    } catch {
      return stats; // No logs directory
    }

    const files = await fs.readdir(logDir);
    const logFiles = files.filter(file => file.endsWith('.log') && file.includes('puremix-'));

    let oldestDate = new Date();
    let newestDate = new Date(0);

    for (const file of logFiles) {
      const filePath = path.join(logDir, file);
      const fileStat = await fs.stat(filePath);
      const sizeMB = fileStat.size / (1024 * 1024);

      stats.files.push({
        name: file,
        size: fileStat.size,
        created: fileStat.birthtime,
        modified: fileStat.mtime
      });

      stats.totalSizeMB += sizeMB;

      if (fileStat.birthtime < oldestDate) {
        oldestDate = fileStat.birthtime;
        stats.oldestFile = file;
      }

      if (fileStat.birthtime > newestDate) {
        newestDate = fileStat.birthtime;
        stats.newestFile = file;
      }
    }

    stats.fileCount = logFiles.length;
    stats.totalSizeMB = Math.round(stats.totalSizeMB * 100) / 100;

    // Sort files by creation date (newest first)
    stats.files.sort((a, b) => b.created.getTime() - a.created.getTime());

    return stats;
  }

  /**
   * Clean old logs with advanced retention policies
   */
  static async cleanOldLogs(options: LogCleanOptions): Promise<string[]> {
    const logDir = this.DEFAULT_LOG_DIR;
    const cleanedFiles: string[] = [];
    const stats = await this.getLogStats();

    if (stats.fileCount === 0) {
      return cleanedFiles;
    }

    // Sort files by age (oldest first for cleanup)
    const filesByAge = [...stats.files].sort((a, b) => a.created.getTime() - b.created.getTime());

    // Apply retention policies
    for (let i = 0; i < filesByAge.length; i++) {
      const file = filesByAge[i];
      const filePath = path.join(logDir, file.name);
      const ageInDays = (Date.now() - file.created.getTime()) / (1000 * 60 * 60 * 24);
      let shouldClean = false;
      let reason = '';

      // Check max files policy
      if (options.maxFiles && stats.fileCount > options.maxFiles) {
        const filesToRemove = stats.fileCount - options.maxFiles;
        if (i < filesToRemove) {
          shouldClean = true;
          reason = `exceeds max files limit (${options.maxFiles})`;
        }
      }

      // Check max age policy
      if (options.maxAgeDays && ageInDays > options.maxAgeDays) {
        shouldClean = true;
        reason = `exceeds max age (${options.maxAgeDays} days)`;
      }

      // Check total size policy
      if (options.maxSizeMB && stats.totalSizeMB > options.maxSizeMB) {
        shouldClean = true;
        reason = `exceeds max size limit (${options.maxSizeMB}MB)`;
      }

      if (shouldClean) {
        if (options.archiveOldLogs && !file.name.endsWith('.gz')) {
          // Archive (compress) instead of delete
          await this.compressLogFile(filePath);
          cleanedFiles.push(`Archived: ${file.name} → ${file.name}.gz (${reason})`);
        } else {
          // Delete the file
          await fs.unlink(filePath);
          cleanedFiles.push(`Deleted: ${file.name} (${reason})`);
          stats.totalSizeMB -= file.size / (1024 * 1024);
          stats.fileCount--;
        }
      }
    }

    return cleanedFiles;
  }

  /**
   * Get recent log entries with filtering
   */
  static async getTailLogs(options: {
    lines?: number;
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    search?: string;
    since?: string;
  } = {}): Promise<string[]> {
    const logDir = this.DEFAULT_LOG_DIR;
    const stats = await this.getLogStats();
    
    if (stats.fileCount === 0) {
      return ['No log files found'];
    }

    // Get the most recent log file
    const newestFile = stats.files[0];
    const filePath = path.join(logDir, newestFile.name);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      let filteredLines = lines;

      // Apply filters
      if (options.level) {
        filteredLines = filteredLines.filter(line => {
          try {
            const logEntry = JSON.parse(line);
            return logEntry.level === options.level;
          } catch {
            return false;
          }
        });
      }

      if (options.search) {
        filteredLines = filteredLines.filter(line => 
          line.toLowerCase().includes(options.search!.toLowerCase())
        );
      }

      if (options.since) {
        const sinceDate = new Date(options.since);
        filteredLines = filteredLines.filter(line => {
          try {
            const logEntry = JSON.parse(line);
            return new Date(logEntry.timestamp) >= sinceDate;
          } catch {
            return false;
          }
        });
      }

      // Return last N lines
      const linesToReturn = options.lines || 50;
      return filteredLines.slice(-linesToReturn);
    } catch (error) {
      return [`Error reading log file: ${error instanceof Error ? error.message : 'Unknown error'}`];
    }
  }

  /**
   * Compress a log file using gzip
   */
  private static async compressLogFile(filePath: string): Promise<void> {
    const compressedPath = filePath + '.gz';
    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(compressedPath);
    const gzipStream = createGzip();

    await pipeline(readStream, gzipStream, writeStream);
    await fs.unlink(filePath); // Remove original file
  }

  /**
   * Determine if a log file should be flushed based on criteria
   */
  private static shouldFlushFile(fileName: string, stats: any, options: LogFlushOptions): boolean {
    if (options.all) {
      // Keep today's log file
      const today = new Date().toISOString().split('T')[0];
      return !fileName.includes(today);
    }

    if (options.before) {
      const beforeDate = new Date(options.before);
      return stats.birthtime < beforeDate;
    }

    if (options.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.days);
      return stats.birthtime < cutoffDate;
    }

    return false;
  }
}

// Default export for ES module compatibility
export default LogManager;