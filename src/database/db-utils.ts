import { UpsertDbItem } from "../model/shared-models/db-operation-types.model";

/** Returns the search query to use in a mongodb update/upsert operation.
 *   If the _id is not set, we must provide an empty object for the search query.
 *   Otherwise, we need to provide an object with an _id value.
 */
export function getUpsertMatchObject(target: UpsertDbItem<any>): object {
    if (!target._id) {
        return {};
    }

    return { _id: target._id };
}