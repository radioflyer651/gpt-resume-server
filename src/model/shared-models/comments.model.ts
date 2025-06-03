
/** Just a piece of information to attach to other items. */
export interface Comment {
    /** The title or subject of the comment. */
    title: string;

    /** Details about this comment. */
    detail: string;

    /** When set, this comment should be removed from AI contexts that might go to outside users. */
    isPrivateComment?: boolean;
}