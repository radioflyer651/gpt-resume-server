

export type NewDbItem<T> = Omit<T, '_id'>;

export type UpsertDbItem<T> = NewDbItem<T> & { _id?: string; };

/** Given a specified object, assuming it's of a certain DB Type, returns whether or not it has an _id,
 *   indicating whether or not it's a NewDbItem. */
export function isNewDbItem<T>(target: NewDbItem<T> | T): target is NewDbItem<T> {
    return '_id' in (target as any);
}