import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'Interface Forge',
    tagline:
        'A TypeScript library for creating strongly typed mock data factories using Faker.js for test data generation',
    favicon: 'img/favicon.ico',

    // Set the production url of your site here
    url: 'https://goldziher.github.io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/interface-forge/',

    // GitHub pages deployment config.
    organizationName: 'Goldziher', // Usually your GitHub org/user name.
    projectName: 'interface-forge', // Usually your repo name.

    onBrokenLinks: 'throw',
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    plugins: [],

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    editUrl: 'https://github.com/Goldziher/interface-forge/tree/main/docs/',
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        image: 'img/logo.png',
        navbar: {
            title: 'Interface Forge',
            logo: {
                alt: 'Interface Forge Logo',
                src: 'img/logo.png',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docs',
                    position: 'left',
                    label: 'Docs',
                },
                {
                    to: '/docs/api',
                    label: 'API',
                    position: 'left',
                },
                {
                    href: 'https://github.com/Goldziher/interface-forge',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Introduction',
                            to: '/docs',
                        },
                        {
                            label: 'API Reference',
                            to: '/docs/api',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/Goldziher/interface-forge',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Na'aman Hirschfeld. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
