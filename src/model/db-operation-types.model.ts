

export type NewDbItem<T> = Omit<T, '_id'>;

export type UpsertDbItem<T> = NewDbItem<T> & { _id?: string; };