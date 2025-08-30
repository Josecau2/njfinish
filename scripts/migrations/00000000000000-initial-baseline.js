'use strict';

/**
 * Baseline migration: create SequelizeMeta table and ensure core tables exist.
 * Keep minimal to avoid destructive changes; real schema evolves via later migrations.
 */

module.exports = {
  async up({ context: qi }) {
    // Ensure SequelizeMeta exists (SequelizeStorage handles automatically), keep file for baseline.
    // Optionally ensure a no-op for idempotency.
    return Promise.resolve();
  },

  async down({ context: qi }) {
    // No-op baseline rollback
    return Promise.resolve();
  }
};
