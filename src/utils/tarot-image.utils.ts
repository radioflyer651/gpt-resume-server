import * as path from 'path';
import * as fs from 'fs/promises';

/** The absolute path to the folder holding the tarot card images. */
export const TAROT_IMAGE_FILE_FOLDER_PATH = path.join(__dirname, '..', 'tarot-game/game-images');

/** Given a specified tarot image's file name, returns its image number. */
export function getTarotImageNumberFromFileName(fileName: string): number {
    // Get a match on the file name using regex.
    const filePattern = /^.*_(\d+)(\.png)?_?$/i;
    const match = filePattern.exec(fileName);

    // Ensure we have a match.
    if (!match) {
        throw new Error(`Invalid file name.`);
    }

    // The number should be the first group in the match.
    const numberMatch = match[1];

    // Return the number.  If it wasn't a number, let the call fail.
    return parseInt(numberMatch);
}

/** Given a file base name, and an image number, returns a file name for a file to return. */
export async function getFileNameForImageNumber(fileBaseName: string, fileNumber: number): Promise<string | undefined> {
    // We could piece it together, but we should just make sure the file exists, and return the right one:

    // Get the folder contents for images.
    const imageFolderContent = await fs.readdir(TAROT_IMAGE_FILE_FOLDER_PATH);

    // Find all files that match the base file name.  Make sure it's all lower case - just in case.
    fileBaseName = fileBaseName.toLowerCase();

    // Filter based on the base name and number.
    const result = imageFolderContent
        .find(f => f.toLowerCase().startsWith(fileBaseName) && getTarotImageNumberFromFileName(f) === fileNumber);

    // Return the full path to the result.
    return result
        ? path.join(TAROT_IMAGE_FILE_FOLDER_PATH, result)
        : undefined;
}