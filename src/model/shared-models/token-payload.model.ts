
export interface TokenPayload {
    companyName: string;
    website: string;

    /** The name of the user. */
    name: string;

    /** The User ID (Object ID - probably a guid.) */
    userId?: string;

    /** Boolean value indicating whether or not the associated user is an admin user. */
    isAdmin?: boolean;
}
