import * as path from 'path';
import * as fs from 'fs/promises';


/** The absolute file path to the folder to hold audio files received
 *   from the AI. */
export const AUDIO_FILE_PATH = path.join(__dirname, '../../audio-responses');

/** Ensures that the path to the audio file folder exists. */
export async function initializeAudioFilePath(): Promise<void> {
    try {
        await fs.mkdir(AUDIO_FILE_PATH);
    } catch {
        // If we get an error, then the folder probably already exists.
    }
}

/** Saves specified audio content to the audio file folder, assigning it a specified extensions. 
 *   Only the file name is returned (not the full path).  Use the getAudioFilePathForFileName method
 *   to translate. */
export async function saveAudioFile(fileContent: any, fileExtension: string): Promise<string> {
    // Create a random file name.
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = path.join(AUDIO_FILE_PATH, fileName);

    // Write the file to the folder.
    await fs.writeFile(filePath, fileContent, 'binary');
    return fileName;
}

/** Returns the binary file content for a specified audio file name. */
export function getAudioFileContent(fileName: string): Promise<any> {
    // Get the file path.
    const filePath = getAudioFilePathForFileName(fileName);

    // Read and return the file content.
    return fs.readFile(filePath, 'binary');
}

/** Returns a boolean value indicating whether or not a specified audio file exists. 
 *   This aids in 404 errors. */
export function getAudioFileExists(fileName: string): Promise<boolean> {
    // Get the file path.
    const filePath = getAudioFilePathForFileName(fileName);

    // Check if the file exists.
    return fs.access(filePath)
        .then(() => true)
        .catch(() => false);
}

/** Returns the absolute path to an audio file, specified by the name of the audio file. */
export function getAudioFilePathForFileName(fileName: string): string {
    return path.join(AUDIO_FILE_PATH, fileName);
}