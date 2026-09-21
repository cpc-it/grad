# Cal Poly Graduate Education Frontend

This repository contains the Next.js frontend for the Cal Poly Graduate Education site. It uses Faust.js to pull content from WordPress over WPGraphQL and render a mix of custom React pages and WordPress-driven templates.

## Stack

- Next.js 14
- React 18
- Faust.js / `@faustwp/core`
- Apollo Client
- WordPress + WPGraphQL as the content source
- Sass modules for styling

## What This App Does

- Renders a custom homepage from [`pages/index.js`](/Users/bchenowe/Sites/grad/pages/index.js)
- Renders WordPress pages, posts, archives, and custom post types through [`pages/[...wordpressNode].js`](/Users/bchenowe/Sites/grad/pages/[...wordpressNode].js)
- Supports preview mode through [`pages/preview.js`](/Users/bchenowe/Sites/grad/pages/preview.js)
- Exposes Faust API routes through [`pages/api/faust/[[...route]].js`](/Users/bchenowe/Sites/grad/pages/api/faust/[[...route]].js)
- Includes a custom site search page at [`pages/search.js`](/Users/bchenowe/Sites/grad/pages/search.js)

## Requirements

- Node.js `>=20 <21`
- npm `>=10 <11`
- A WordPress site with Faust and WPGraphQL configured

## Environment Variables

Copy `.env.local.sample` to `.env.local` and set the values for your environment.

Required variables:

- `NEXT_PUBLIC_WORDPRESS_URL`: base URL of the connected WordPress site
- `NEXT_PUBLIC_SITE_URL`: public URL of the frontend site, used for canonical links, sitemaps, and social metadata
- `FAUST_SECRET_KEY`: Faust secret from WordPress

Optional variables:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 measurement ID

Example:

```bash
cp .env.local.sample .env.local
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production server locally:

```bash
npm run start
```

## Available Scripts

- `npm run dev`: run the Faust/Next development server
- `npm run build`: create a production build
- `npm run start`: start the built app
- `npm run lint`: run the configured linter
- `npm run generate`: regenerate GraphQL possible types
- `npm run format`: format JS/JSX/SCSS/Markdown with Prettier
- `npm run format:check`: verify formatting
- `npm run clean`: remove `.next` and `node_modules`

## Project Layout

- [`pages/`](/Users/bchenowe/Sites/grad/pages): Next.js routes
- [`wp-templates/`](/Users/bchenowe/Sites/grad/wp-templates): Faust template mappings for WordPress content types
- [`components/`](/Users/bchenowe/Sites/grad/components): shared UI components
- [`styles/`](/Users/bchenowe/Sites/grad/styles): global Sass and page-level styles
- [`queries/`](/Users/bchenowe/Sites/grad/queries): GraphQL queries
- [`fragments/`](/Users/bchenowe/Sites/grad/fragments): GraphQL fragments
- [`plugins/`](/Users/bchenowe/Sites/grad/plugins): custom Faust plugins
- [`constants/`](/Users/bchenowe/Sites/grad/constants): menu locations and other constants
- [`utilities/`](/Users/bchenowe/Sites/grad/utilities): helper functions
- [`public/`](/Users/bchenowe/Sites/grad/public): static assets

## WordPress Integration

Faust configuration lives in:

- [`faust.config.js`](/Users/bchenowe/Sites/grad/faust.config.js)
- [`next.config.js`](/Users/bchenowe/Sites/grad/next.config.js)
- [`app.config.js`](/Users/bchenowe/Sites/grad/app.config.js)

Template mapping is defined in [`wp-templates/index.js`](/Users/bchenowe/Sites/grad/wp-templates/index.js).

Current mapped templates include:

- `front-page`
- `page`
- `single`
- `project`
- `program`
- `programs`
- `archive`

Menu locations are defined in [`constants/menus.js`](/Users/bchenowe/Sites/grad/constants/menus.js).

## Notes For Maintainers

- The homepage is not a generic WordPress template. It is a custom React page with hand-authored sections and GraphQL queries.
- Some repository artifacts are inherited from the original Atlas blueprint, including `acm-blueprint.zip`, `atlas-blueprint-portfolio.zip`, and project/program template support.
- Component-level `README.md` files under [`components/`](/Users/bchenowe/Sites/grad/components) are local implementation notes and not the main project guide.
- There is currently no dedicated automated test suite in the root scripts. Validation is mainly through linting and manual verification.

## Content Model Export

If you need to update the Atlas Content Modeler blueprint export, see [`DEVELOPMENT.md`](/Users/bchenowe/Sites/grad/DEVELOPMENT.md). That file is still relevant for import/export workflow of the blueprint zip and related WordPress content model tasks.
