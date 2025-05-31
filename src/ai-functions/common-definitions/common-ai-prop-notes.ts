

/* The following are comments added to AI Function definitions that commonly add information that the AI must know for common types. */



export const OBJECT_ID_NOTE = `(This is the string form of a MongoDB ObjectId, which will be converted to an ObjectId using the "new ObjectId(x)" method.)`;

export const DATE_STRING_NOTE = `(Dates are provided in string form, and converted by the application to a JavaScript Date() object.  This string must be able to be converted using the new Date(string) call.)`;