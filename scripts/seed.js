import 'dotenv/config';
import pool from '../src/db.js';

const TOTAL_PRODUCTS = 200000;
const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 10000;

const categories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home',
  'Sports',
  'Toys',
  'Food',
  'Beauty',
  'Automotive',
  'Garden',
];

const adjectives = [
  'Agile',
  'Bold',
  'Cozy',
  'Fresh',
  'Golden',
  'Happy',
  'Lively',
  'Modern',
  'Nimble',
  'Quiet',
  'Rapid',
  'Smart',
  'Sunny',
  'Vivid',
  'Witty',
];

const nouns = [
  'Anchor',
  'Beam',
  'Bottle',
  'Chair',
  'Circuit',
  'Cloud',
  'Compass',
  'Falcon',
  'Garden',
  'Gadget',
  'Mirror',
  'Notebook',
  'Orbit',
  'Rocket',
  'Torch',
];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function pickRandom(items) {
  return items[randomInt(items.length)];
}

function randomProductName() {
  const suffix = String(1000 + randomInt(9000));
  return `Product ${pickRandom(adjectives)} ${pickRandom(nouns)} ${suffix}`;
}

function randomPrice() {
  return (10 + Math.random() * (9999.99 - 10)).toFixed(2);
}

function randomCreatedAt() {
  const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - Math.floor(Math.random() * twoYearsInMs));
}

function randomUpdatedAt(createdAt) {
  const maxOffsetMs = 30 * 60 * 1000;
  const offsetMs = Math.floor(Math.random() * (maxOffsetMs + 1));
  return new Date(Math.min(createdAt.getTime() + offsetMs, Date.now()));
}

function buildInsertQuery(rows) {
  const values = [];
  const placeholders = rows.map((row, index) => {
    const baseIndex = index * 5;
    values.push(row.name, row.category, row.price, row.createdAt, row.updatedAt);
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
  });

  return {
    text: `
      INSERT INTO products (name, category, price, created_at, updated_at)
      VALUES ${placeholders.join(', ')}
    `,
    values,
  };
}

async function main() {
  const startedAt = Date.now();
  let inserted = 0;

  try {
    for (let batchStart = 0; batchStart < TOTAL_PRODUCTS; batchStart += BATCH_SIZE) {
      const rowsInBatch = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - batchStart);
      const rows = Array.from({ length: rowsInBatch }, () => {
        const createdAt = randomCreatedAt();

        return {
          name: randomProductName(),
          category: pickRandom(categories),
          price: randomPrice(),
          createdAt,
          updatedAt: randomUpdatedAt(createdAt),
        };
      });

      const { text, values } = buildInsertQuery(rows);
      await pool.query(text, values);

      inserted += rowsInBatch;

      if (inserted % PROGRESS_INTERVAL === 0 || inserted === TOTAL_PRODUCTS) {
        console.log(`Inserted ${inserted} / ${TOTAL_PRODUCTS}`);
      }
    }

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    console.log(`Total time taken: ${elapsedSeconds.toFixed(2)} seconds`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
