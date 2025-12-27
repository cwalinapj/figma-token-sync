/**
 * Output Writer
 * 
 * Handles writing generated token files to disk with
 * directory creation and change detection.
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { createHash } from 'crypto';

export class OutputWriter {
  private previousHashes: Map<string, string> = new Map();

  /**
   * Write content to a file, creating directories as needed
   */
  async write(filePath: string, content: string): Promise<boolean> {
    // Ensure directory exists
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Check if content has changed
    const newHash = this.hashContent(content);
    const oldHash = this.previousHashes.get(filePath);

    if (oldHash === newHash) {
      return false; // No change
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
    this.previousHashes.set(filePath, newHash);

    return true; // Changed
  }

  /**
   * Read existing file hash for comparison
   */
  async loadExistingHash(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.previousHashes.set(filePath, this.hashContent(content));
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Generate content hash
   */
  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }
}
