import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    docs: [
        'index',
        {
            type: 'category',
            label: 'Getting Started',
            items: ['getting-started/installation', 'getting-started/basic-usage'],
        },
        {
            type: 'category',
            label: 'Core Concepts',
            items: ['core/factory-basics', 'core/composition', 'core/generators'],
        },
        {
            type: 'category',
            label: 'Schema Integration',
            items: ['schema/zod-integration', 'schema/custom-handlers'],
        },
        {
            type: 'category',
            label: 'Advanced Features',
            items: ['advanced/persistence', 'advanced/fixtures', 'advanced/depth-control'],
        },
        'examples',
        'api',
    ],
};

export default sidebars;
