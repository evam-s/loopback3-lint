// Hand-authored, not derived: these are the OTHER frameworks' words, and
// exist so a message can name where a habit came from.
export const FOREIGN_IDIOMS: Record<string, { origin: string; lb3: string }> = {
  select:     { origin: 'Mongoose/Sequelize', lb3: 'fields' },
  attributes: { origin: 'Sequelize',          lb3: 'fields' },
  populate:   { origin: 'Mongoose',           lb3: 'include' },
  sort:       { origin: 'MongoDB',            lb3: 'order' },
  orderBy:    { origin: 'SQL/Sequelize',      lb3: 'order' },
  take:       { origin: 'TypeORM',            lb3: 'limit' },
};

/** where-operator lookalikes from other query languages. */
export const FOREIGN_OPERATORS: Record<string, { origin: string; lb3: string | null }> = {
  in:     { origin: 'MongoDB', lb3: 'inq' },
  ne:     { origin: 'MongoDB', lb3: 'neq' },
  regex:  { origin: 'MongoDB', lb3: 'regexp' },
  exists: { origin: 'MongoDB', lb3: null },
  not:    { origin: 'MongoDB', lb3: null },
};
