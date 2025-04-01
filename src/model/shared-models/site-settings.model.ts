

/** Site settings that are stored in the database. */
export interface SiteSettings {
    type: 'site-settings';
    /** Indicates whether users can play AI chat audio. */
    allowAudioChat?: boolean;
}