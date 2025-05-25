import https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';

// https://emailverification.whoisxmlapi.com/api/v3?apiKey=at_4NTelz5Xg8gfmoF8oYduLHvGdDeWY&emailAddress=support@whoisxmlapi.com

export const EMAIL_VERIFICATION_PATH = path.join(__dirname, '..', 'email-verifications.json');

export interface EmailVerification {
    email: string;
    isValid: boolean;
}

let emailVerifications: EmailVerification[] | undefined = undefined;

export async function saveEmailVerifications(): Promise<void> {
    if (!emailVerifications) {
        return;
    }

    try {
        // Delete the file.
        //  Catch the error if it doesn't exist.
        fs.unlink(EMAIL_VERIFICATION_PATH);
    } catch {

    }

    // Write the file.
    const fileContent = JSON.stringify(emailVerifications, undefined, 2);
    await fs.writeFile(EMAIL_VERIFICATION_PATH, fileContent, 'utf8');

}

export async function getEmailVerifications(): Promise<EmailVerification[]> {
    if (emailVerifications) {
        return emailVerifications;
    }

    try {
        const fileContent = await fs.readFile(EMAIL_VERIFICATION_PATH, 'utf8');
        emailVerifications = JSON.parse(fileContent);
        return emailVerifications!;
    } catch (err) {
        return [];
    }
}

async function appendEmailVerification(verification: EmailVerification): Promise<void> {
    const verifications = await getEmailVerifications();
    verifications.push(verification);
    await saveEmailVerifications();
}


export async function verifyEmail(email: string): Promise<boolean> {
    https.get({
        path: `https://emailverification.whoisxmlapi.com/api/v3?apiKey=at_4NTelz5Xg8gfmoF8oYduLHvGdDeWY&emailAddress=${email}`
    }, (res) => {

    });
}