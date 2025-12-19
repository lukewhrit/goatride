# Contributing Guide

Thank you for your interest in contributing to GoatRide.

## Table of Contents

- [Contributing Guide](#contributing-guide)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [Directory Structure](#directory-structure)
  - [Tools](#tools)
    - [Code Linting](#code-linting)
      - [EditorConfig](#editorconfig)
      - [Prettier](#prettier)
      - [ESLint](#eslint)
      - [Husky (Commit Messages)](#husky-commit-messages)
    - [Design and Components](#design-and-components)
      - [PostCSS](#postcss)
      - [TailwindCSS](#tailwindcss)
      - [shadcn/ui](#shadcnui)
    - [BetterAuth](#betterauth)
    - [Prisma ORM](#prisma-orm)
  - [Other Useful Information](#other-useful-information)

## Prerequisites

- Node.js
- Git
- [pnpm](https://pnpm.io/installation) Package Manager

## Initial Setup

1. After cloning the repository, run `pnpm install` to install any necessary packages.
2. Now, run `pnpm dev` to initialize the development server.
3. Visit `http://localhost:3000` to view the project, updated with changes as they are made.

## Directory Structure

- Project configuration files are in the root directory.
- Project code is in the `src/` directory.
  - [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

## Tools

### Code Linting

#### EditorConfig

EditorConfig allows your code editor to automatically adhere to our project's coding style. For example, it will automatically configure your editor to use indents that are 2 characters wide and are made of spaces (not tabs).

Some editors might require a EditorConfig plugin to be installed: [Plugins](https://editorconfig.org/#download).

#### Prettier

Prettier formats code to make sure it all follows the same style and is consistent and readable.

[Editor Integration](https://prettier.io/docs/editors)

#### ESLint

ESLint analyzes the projects code to detect errors and bugs before they make it into the codebase. It also helps enforce code style and checks for accessibility issues in JSX.

The full [AirBNB Style Guide](https://github.com/airbnb/javascript) is available here. Your code should for the most part, follow the style illustrated in that guide document. It is not necessary to read over the entire thing since your editor should alert you of any issues and how to fix them.

If your editor is not reporting ESLint issues, you might need a [plugin](https://eslint.org/docs/latest/use/integrations).

#### Husky (Commit Messages)

Husky is a tool that allows code to run before changes are pushed to git.

When you run `git commit`,

- `lint-staged` will run Prettier and ESLint against your code, ensuring that it is formatted correctly
- `commitlint` will run to make sure your commit messages followed [the correct format](https://www.conventionalcommits.org/en/v1.0.0/#summary).

If you want to make sure your commit messages always follow convention, you can install [Commitizen](https://github.com/commitizen/cz-cli).

### Design and Components

#### PostCSS

PostCSS is a tool that integrates CSS and JavaScript. It integrates our CSS with Next.js and does a bunch of other magic.

#### [TailwindCSS](https://tailwindcss.com/)

TailwindCSS is a CSS utility framework that provides a large number of classes that are used to style components. Instead of writing CSS for each component, use TailwindCSS classes to style it in the JSX.

#### [shadcn/ui](https://ui.shadcn.com/docs)

Unstyled UI components that streamline adding new functionality to the frontend. Instead of implementing our own buttons, navigation menus, dialogs, etc. we use shadcn/ui and customize them to fit our design.

### BetterAuth

### Prisma ORM

## Other Useful Information

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React.js Documentation](https://react.dev/)
  - [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs/components)
