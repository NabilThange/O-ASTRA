import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Aria Docs',
  tagline: 'Internal documentation for the Aria project',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'http://localhost',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'aria', // Usually your GitHub org/user name.
  projectName: 'aria', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Aria Docs',
      logo: {
        alt: 'Aria Logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/docs/docs/prd', label: 'PRD', position: 'left'},
        {to: '/docs/docs/progress', label: 'Progress', position: 'left'},
        {to: '/docs/docs/frontend', label: 'Frontend', position: 'left'},
        {to: '/docs/docs/backend', label: 'Backend', position: 'left'},
        {to: '/docs/docs/docker-database', label: 'Docker DB', position: 'left'},
        {to: '/docs/docs/docker-desktop', label: 'Docker Desktop', position: 'left'},
        {to: '/docs/docs/architecture', label: 'Architecture', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'PRD',
              to: '/docs/docs/prd',
            },
            {
              label: 'Frontend',
              to: '/docs/docs/frontend',
            },
            {
              label: 'Backend',
              to: '/docs/docs/backend',
            },
          ],
        },
        {
          title: 'Setup',
          items: [
            {
              label: 'Docker Database',
              to: '/docs/docs/docker-database',
            },
            {
              label: 'Docker Desktop',
              to: '/docs/docs/docker-desktop',
            },
            {
              label: 'Architecture',
              to: '/docs/docs/architecture',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Progress',
              to: '/docs/docs/progress',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Aria Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
