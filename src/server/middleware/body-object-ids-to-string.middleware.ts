import { objectIdToStringConverter } from "../../utils/object-id-to-string-converter.utils";

/** Middleware to convert any ObjectId in the body of a request to a string. */
export function bodyObjectIdsToStringMiddleware(req: any, res: any, next: any) {
    // If the request body exists and is an object, convert any string properties
    //  This has a little risk, since a string could be misinterpreted as an ObjectId, 
    //  but it's a low risk.
    if (req.body && typeof req.body === 'object') {
        req.body = objectIdToStringConverter(req.body);
    }

    // Continue.
    next();
}