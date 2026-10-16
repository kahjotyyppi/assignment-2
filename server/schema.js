export const databases = {
  library_db: {
    label: 'Library',
    description: 'Books and library members',
    tables: {
      books: {
        label: 'Books',
        columns: [
          { name: 'title', type: 'text', required: true },
          { name: 'author', type: 'text', required: true },
          { name: 'year', type: 'integer' },
          { name: 'genre', type: 'text' },
          { name: 'available', type: 'boolean', default: true },
        ],
        seed: [
          ['Dune', 'Frank Herbert', 1965, 'Science fiction', true],
          ['The Hobbit', 'J. R. R. Tolkien', 1937, 'Fantasy', false],
          ['1984', 'George Orwell', 1949, 'Dystopia', true],
          ['The Unknown Soldier', 'Väinö Linna', 1954, 'War', true],
        ],
      },
      members: {
        label: 'Members',
        columns: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'text' },
          { name: 'joined', type: 'date' },
        ],
        seed: [
          ['Aino Virtanen', 'aino@example.com', '2023-02-14'],
          ['Mikko Korhonen', 'mikko@example.com', '2024-09-01'],
        ],
      },
    },
  },

  school_db: {
    label: 'School',
    description: 'Students and courses',
    tables: {
      students: {
        label: 'Students',
        columns: [
          { name: 'first_name', type: 'text', required: true },
          { name: 'last_name', type: 'text', required: true },
          { name: 'email', type: 'text' },
          { name: 'grade_level', type: 'integer' },
        ],
        seed: [
          ['Emma', 'Nieminen', 'emma.n@school.example', 10],
          ['Leo', 'Mäkinen', 'leo.m@school.example', 11],
          ['Sofia', 'Laine', 'sofia.l@school.example', 12],
        ],
      },
      courses: {
        label: 'Courses',
        columns: [
          { name: 'code', type: 'text', required: true },
          { name: 'name', type: 'text', required: true },
          { name: 'credits', type: 'integer' },
          { name: 'teacher', type: 'text' },
        ],
        seed: [
          ['MATH101', 'Calculus I', 5, 'Dr. Heikkinen'],
          ['CS110', 'Intro to Programming', 5, 'Ms. Koskinen'],
          ['HIST200', 'Nordic History', 3, 'Mr. Järvinen'],
        ],
      },
    },
  },

  store_db: {
    label: 'Store',
    description: 'Products and customers',
    tables: {
      products: {
        label: 'Products',
        columns: [
          { name: 'name', type: 'text', required: true },
          { name: 'category', type: 'text' },
          { name: 'price', type: 'numeric' },
          { name: 'stock', type: 'integer', default: 0 },
        ],
        seed: [
          ['Coffee mug', 'Kitchen', 12.5, 40],
          ['Wool socks', 'Clothing', 9.9, 120],
          ['Headlamp', 'Outdoor', 34.0, 15],
        ],
      },
      customers: {
        label: 'Customers',
        columns: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'text' },
          { name: 'city', type: 'text' },
        ],
        seed: [
          ['Jussi Lehtonen', 'jussi@example.com', 'Helsinki'],
          ['Laura Salo', 'laura@example.com', 'Tampere'],
        ],
      },
    },
  },
}

const SQL_TYPES = {
  text: 'TEXT',
  integer: 'INTEGER',
  numeric: 'NUMERIC(12, 2)',
  boolean: 'BOOLEAN',
  date: 'DATE',
}

export function createTableSql(tableName, table) {
  const cols = table.columns.map((c) => {
    let sql = `"${c.name}" ${SQL_TYPES[c.type]}`
    if (c.required) sql += ' NOT NULL'
    if (c.default !== undefined) sql += ` DEFAULT ${c.default}`
    return sql
  })
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY, ${cols.join(', ')})`
}
