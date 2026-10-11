# GoatRide

GoatRide is a college-focused ridesharing platform designed to make coordinating simple, reliable, and social. Founded at WPI, we make it easy for college students to create, discover, and join rides while automatically managing availability and participation.

Years ago, campus ridesharing was nothing more than a corkboard in the student center where drivers could post notes advertising a ride. Most colleges have gotten rid of this, but the problem of getting home over break or around town still exists for many students. Nowadays, campus ridesharing often relies on group chats. GoatRide centralizes this process by providing a dedicated system for organizing rides, tracking availability, and reducing friction in day-to-day transportation within a university community.

The application was built by students using Next.JS and TypeScript, with Prisma for database management and BetterAuth for secure user authentication. GoatRide is designed to be lightweight, predictable, and easy to maintain, with a responsive interface that works well across desktop and mobile devices.

## Table of Contents

- [GoatRide](#goatride)
  - [Table of Contents](#table-of-contents)
  - [Development](#development)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [Credits](#credits)
  - [Vulnerabilities](#vulnerabilities)
  - [License](#license)

## Development

Requires Node 22+, pnpm, and a Postgres database.

```sh
pnpm install
cp .env.example .env   # then fill in the values
pnpm prisma migrate dev
pnpm dev
```

Before opening a PR, run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. CI runs these plus a migration check and a production build.

## Deployment

GoatRide is deployed on Vercel, with Postgres from Neon and avatar storage in Vercel Blob (both added through the Vercel Marketplace), and a daily Vercel Cron job that expires past rides.

One-time setup in the Vercel project:

1. **Storage → Create → Neon**, connected to all environments. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Turn on Neon's preview branching so preview deployments get their own database branch; otherwise they run migrations against production.
2. **Storage → Create → Blob**. This sets `BLOB_READ_WRITE_TOKEN`.
3. **Settings → Environment Variables**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (production only, `https://<your domain>`), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_KEY`, and `CRON_SECRET`.

Every build runs `prisma migrate deploy` before `next build`, so pushing to `main` applies pending migrations and deploys.

## Contributing

Thank you for your interest in contributing to GoatRide. Please view our [Contributors Guide](.github/CONTRIBUTING.md) to get started.

## Credits

## Vulnerabilities

The GoatRide team takes security very seriously. If you detect a vulnerability please contact us via email (lukewhrit@proton.me) or create a vulnerability report via Github. We request that you hold of on publishing any vulnerabilities until after they've been patched, or at least 60 days have passed since you reported it.

## License

GoatRide is licensed under the GNU General Public License v3.0 license. A copy of this license can be found within the [`LICENSE`](LICENSE) file.
