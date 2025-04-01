import { initializeAudioFilePath } from "./utils/audio-folder.methods";


/** Handles misc setup and initialization of things like file folders and the like. */
export async function systemInitialization(): Promise<void> {
    // Ensure we ha
    await initializeAudioFilePath();

    // Setup the tarot cards if needed (this is a TODO).
}