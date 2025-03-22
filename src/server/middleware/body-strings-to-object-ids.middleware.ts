import { Request, Response, NextFunction } from 'express';
import { stringToObjectIdConverter } from '../../utils/object-id-to-string-converter.utils';


/**
 * Middleware to convert string representations of ObjectIds in the request body to actual ObjectId objects.
 * 
 * This middleware checks if the request body exists and then converts any string representations of ObjectIds
 * to their corresponding ObjectId objects using the `stringToObjectIdConverter` utility function.
 * 
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export function bodyStringsToObjectIdsMiddleware(req: Request, res: Response, next: NextFunction) {

    // Get the existing json method, so we make our own, but continue using that one.
    const json = res.json;

    // Override the json method.
    res.json = function (body: any) {
        // Convert any object IDs to strings.
        body = stringToObjectIdConverter(body);

        // Call the original json method.
        return json.call(this, body);
    };

    next();
}