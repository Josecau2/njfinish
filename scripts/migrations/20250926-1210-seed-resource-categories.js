'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const categories = [
      { name: 'Announcements', slug: 'announcements', description: 'Important product and platform updates.', color: '#F97316', icon: 'cil-bullhorn', sort_order: 1, is_pinned: true, pinned_order: 1 },
      { name: 'Getting Started', slug: 'getting-started', description: 'Onboarding resources to help new users learn the platform.', color: '#2563EB', icon: 'cil-lightbulb', sort_order: 2, is_pinned: true, pinned_order: 2 },
      { name: 'Catalogues', slug: 'catalogues', description: 'Latest manufacturer catalogues and product sheets.', color: '#059669', icon: 'cil-library', sort_order: 3 },
      { name: 'Video Training', slug: 'video-training', description: 'Recorded walkthroughs and feature highlights.', color: '#D97706', icon: 'cil-movie', sort_order: 4 },
      { name: 'Audio Guides', slug: 'audio-guides', description: 'Listen to quick tips and updates on the go.', color: '#7C3AED', icon: 'cil-headphones', sort_order: 5 },
      { name: 'Reference Documents', slug: 'reference-documents', description: 'Policies, templates, and other key documentation.', color: '#0EA5E9', icon: 'cil-description', sort_order: 6 },
    ].map((item, index) => ({
      ...item,
      is_pinned: item.is_pinned ?? false,
      pinned_order: item.pinned_order ?? index + 1,
      is_active: true,
      thumbnail_url: null,
      metadata: null,
      created_at: now,
      updated_at: now,
    }));

    for (const category of categories) {
      await queryInterface.sequelize.query(
        `INSERT INTO resource_categories (name, slug, description, color, icon, sort_order, is_active, is_pinned, pinned_order, thumbnail_url, metadata, created_at, updated_at)
         VALUES (:name, :slug, :description, :color, :icon, :sort_order, :is_active, :is_pinned, :pinned_order, :thumbnail_url, :metadata, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           color = VALUES(color),
           icon = VALUES(icon),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           is_pinned = VALUES(is_pinned),
           pinned_order = VALUES(pinned_order),
           updated_at = VALUES(updated_at)`,
        {
          replacements: {
            ...category,
            is_pinned: category.is_pinned ?? false,
            pinned_order: category.pinned_order ?? 0,
          },
        }
      );
    }
  },

  down: async (queryInterface) => {
    const slugs = [
      'announcements',
      'getting-started',
      'catalogues',
      'video-training',
      'audio-guides',
      'reference-documents',
    ];
    await queryInterface.bulkDelete('resource_categories', {
      slug: slugs,
    });
  },
};
