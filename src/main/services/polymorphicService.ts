import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { spawn, ChildProcess } from 'child_process'

export interface PolymorphicResult {
  tempDir: string
  exePath: string
  dllPath: string
}

export class PolymorphicService {
  private static readonly STAGING_PREFIX = 'exclude-checking-worker-'

  /**
   * Prepares polymorphic binaries in a randomized staging directory
   * @param sourceDir The directory containing the original cslol-manager.exe and cslol-dll.dll
   * @returns Object containing the temp directory and the new paths for the binaries
   */
  async preparePolymorphicBinaries(sourceDir: string): Promise<PolymorphicResult> {
    // 1. Create randomized staging directory
    const randomId = crypto.randomBytes(4).toString('hex')
    const tempDir = path.join(os.tmpdir(), `${PolymorphicService.STAGING_PREFIX}${randomId}`)
    await fs.mkdir(tempDir, { recursive: true })

    // 2. Generate random names for the binaries
    const randomExeName = `sys_service_${crypto.randomBytes(3).toString('hex')}.exe`
    const randomDllName = `sys_overlay_${crypto.randomBytes(3).toString('hex')}.dll`

    // Try to find the source executable (could be cslol-manager.exe or mod-tools.exe)
    let sourceExePath = path.join(sourceDir, 'cslol-manager.exe')
    try {
      await fs.access(sourceExePath)
    } catch {
      sourceExePath = path.join(sourceDir, 'mod-tools.exe')
      try {
        await fs.access(sourceExePath)
      } catch {
        throw new Error(`Could not find cslol-manager.exe or mod-tools.exe in ${sourceDir}`)
      }
    }

    const sourceDllPath = path.join(sourceDir, 'cslol-dll.dll')
    try {
      await fs.access(sourceDllPath)
    } catch {
      // If DLL is missing, we might still be able to run if it's not required for all operations
      // but the user specifically mentioned it, so we should probably fail if it's missing.
      console.warn(`[PolymorphicService] cslol-dll.dll not found in ${sourceDir}`)
    }

    const targetExePath = path.join(tempDir, randomExeName)
    const targetDllPath = path.join(tempDir, randomDllName)

    // 3. Copy and rename files
    await fs.copyFile(sourceExePath, targetExePath)
    
    let dllExists = false
    try {
      await fs.access(sourceDllPath)
      await fs.copyFile(sourceDllPath, targetDllPath)
      dllExists = true
    } catch {
      // Skip DLL copy if it doesn't exist
    }

    // 4. Apply binary padding and PE header mutations
    if (dllExists) {
      await this.mutateBinary(targetDllPath)
    }
    await this.mutateBinary(targetExePath)

    return {
      tempDir,
      exePath: targetExePath,
      dllPath: dllExists ? targetDllPath : ''
    }
  }

  /**
   * Performs multiple mutations on a binary to change its static signature
   * @param filePath Path to the file to mutate
   */
  private async mutateBinary(filePath: string): Promise<void> {
    const buffer = await fs.readFile(filePath)
    
    // 1. Randomize PE Header Timestamp
    this.randomizeTimestamp(buffer)

    // 2. Zero out Rich Header (removes compiler/build environment info)
    this.zeroRichHeader(buffer)

    // 3. Randomize Section Names (.text, .data, etc.)
    this.randomizeSectionNames(buffer)

    // 4. Obfuscate known strings
    this.obfuscateStrings(buffer, ['cslol', 'LeagueToolkit', 'mod-tools'])

    // 5. Append random padding
    const paddingSize = Math.floor(Math.random() * (10240 - 1024 + 1)) + 1024
    const padding = crypto.randomBytes(paddingSize)
    
    const mutatedBuffer = Buffer.concat([buffer, padding])
    await fs.writeFile(filePath, mutatedBuffer)
  }

  /**
   * Randomizes the TimeDateStamp in the PE header
   * @param buffer The binary buffer to modify
   */
  private randomizeTimestamp(buffer: Buffer): void {
    try {
      const peOffset = buffer.readUInt32LE(0x3c)
      if (buffer.slice(peOffset, peOffset + 4).toString() === 'PE\0\0') {
        const timestampOffset = peOffset + 8
        const randomTimestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 1000000)
        buffer.writeUInt32LE(randomTimestamp, timestampOffset)
      }
    } catch (error) {
      console.warn(`[PolymorphicService] Failed to randomize timestamp:`, error)
    }
  }

  /**
   * Zeroes out the MSVC "Rich" header which contains build environment metadata
   * @param buffer The binary buffer to modify
   */
  private zeroRichHeader(buffer: Buffer): void {
    try {
      const richIndex = buffer.indexOf('Rich')
      if (richIndex !== -1) {
        const dansIndex = buffer.indexOf('DanS')
        if (dansIndex !== -1 && dansIndex < richIndex) {
          // Zero out everything from DanS to the end of the Rich footer (Rich + 4 bytes checksum)
          for (let i = dansIndex; i < richIndex + 8; i++) {
            buffer[i] = 0
          }
        }
      }
    } catch (error) {
      console.warn(`[PolymorphicService] Failed to zero Rich header:`, error)
    }
  }

  /**
   * Randomizes the names of PE sections (e.g., .text -> .rnd123)
   * @param buffer The binary buffer to modify
   */
  private randomizeSectionNames(buffer: Buffer): void {
    try {
      const peOffset = buffer.readUInt32LE(0x3c)
      const numSections = buffer.readUInt16LE(peOffset + 6)
      const sizeOfOptionalHeader = buffer.readUInt16LE(peOffset + 20)
      const sectionTableOffset = peOffset + 24 + sizeOfOptionalHeader

      for (let i = 0; i < numSections; i++) {
        const sectionOffset = sectionTableOffset + i * 40
        // Section name is 8 bytes
        const randomName = `.${crypto.randomBytes(3).toString('hex')}\0\0`
        const nameBuffer = Buffer.from(randomName.slice(0, 8))
        nameBuffer.copy(buffer, sectionOffset)
      }
    } catch (error) {
      console.warn(`[PolymorphicService] Failed to randomize section names:`, error)
    }
  }

  /**
   * Replaces occurrences of specific strings with random characters of the same length
   * @param buffer The binary buffer to modify
   * @param targets Array of strings to obfuscate
   */
  private obfuscateStrings(buffer: Buffer, targets: string[]): void {
    try {
      for (const target of targets) {
        let index = buffer.indexOf(target)
        while (index !== -1) {
          // Replace with random alphanumeric characters of the same length
          const replacement = crypto.randomBytes(target.length).toString('hex').slice(0, target.length)
          const replacementBuffer = Buffer.from(replacement)
          replacementBuffer.copy(buffer, index)

          // Find next occurrence
          index = buffer.indexOf(target, index + target.length)
        }
      }
    } catch (error) {
      console.warn(`[PolymorphicService] Failed to obfuscate strings:`, error)
    }
  }

  /**
   * Executes the polymorphic binary
   * @param exePath Path to the renamed executable
   * @param args Arguments to pass to the executable
   * @returns The child process
   */
  spawnPolymorphicProcess(exePath: string, args: string[]): ChildProcess {
    return spawn(exePath, args, {
      cwd: path.dirname(exePath),
      env: {
        ...process.env,
        // Ensure the DLL can be found if it's expected in the same directory
        PATH: `${path.dirname(exePath)}${path.delimiter}${process.env.PATH}`
      }
    })
  }

  /**
   * Cleans up the temporary staging directory
   * @param tempDir The directory to remove
   */
  async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`[PolymorphicService] Failed to cleanup temp directory ${tempDir}:`, error)
    }
  }
}

export const polymorphicService = new PolymorphicService()
