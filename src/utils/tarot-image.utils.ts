import * as path from 'path';
import * as fs from 'fs/promises';

/** The absolute path to the folder holding the tarot card images. */
export const TAROT_IMAGE_FILE_FOLDER_PATH = path.join(__dirname, '..', 'tarot-game/game-images');

// Cache to hold the file names of the cards in the tarot image folder.
let imageFolderContentCache: string[] | undefined;

/** Caches and returns the files in the tarot image folder. */
async function getImageFolderContents(): Promise<string[]> {
    // Get the folder contents for images, if we don't already have them.
    if (!imageFolderContentCache) {
        imageFolderContentCache = await fs.readdir(TAROT_IMAGE_FILE_FOLDER_PATH);
    }

    return imageFolderContentCache;
}

/** Given a specified image file name, returns the base name that are common for all images
 *   of the same tarot card.
 */
export function getTarotImageFileBaseName(fileName: string): string | undefined {
    // Pattern to parse the file name.
    const pattern = /^(.+)(_\d+)(\.png)?$/i;

    // Parse it.
    const match = pattern.exec(fileName);

    // If none, then it's no match.
    if (!match) {
        return undefined;
    }

    // The first group is the base file name.
    return match[1];
}

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

    // Get the image file contents.
    const imageFolderContent = await getImageFolderContents();

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

/** Returns a map with the base file names, and all image numbers that exist for that base file.
 *   Image file numbers are not guaranteed to be sequential, so we can't just count them.
 */
export async function getTarotCardImageNumbers(): Promise<Map<string, number[]>> {
    // Get the folder contents for images;
    const imageFolderContent = await getImageFolderContents();

    // Create a map to hold the counts.
    const result = new Map<string, number[]>();

    // Count them.
    imageFolderContent.forEach(f => {
        // Get the base name.
        const baseName = getTarotImageFileBaseName(f);

        // If we didn't get a base name, then skip this item.
        if (!baseName) {
            return;
        }

        // Make sure we have a value for this base name.
        if (!result.has(baseName)) {
            // Add a new array.  Now we can treat it as though it's always been there.
            result.set(baseName, []);
        }

        // Get the array, and add this item.
        const currentArray = result.get(baseName)!;
        currentArray.push(getTarotImageNumberFromFileName(f));

    });

    // Return the counts.
    return result;
}