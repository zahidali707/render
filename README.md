# Forge Fitness

A responsive, browser-based gym membership website. No application server or database is required to run the published site. Registration records and prices are stored in the visitor's browser using `localStorage`, so they do not sync between devices or users.

## Development

Node.js is used only for local development, TypeScript checks, unit tests, and generating the static production files.

1. Install Node.js (version 20.19+ or 22.12+).
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Run unit tests with `npm test`.
5. Type-check with `npm run typecheck`.
6. Create the static production site with `npm run build`. The deployable files are written to `dist/`.

The built website can be hosted as static files. The Vite development server is tooling only; the deployed site does not require Node.js.

## Environment variables and API keys

Copy `.env.example` to `.env` only if setting up a **trusted server-side integration**. `process.env.GEMINI_API_KEY` is a Node.js server pattern; there is no server in this project, and the browser app intentionally does not read the key. Vite does not expose unprefixed environment variables to browser code by default. Do not rename it to `VITE_GEMINI_API_KEY`, add it to `define` in Vite configuration, or place a real API key in frontend code: any key shipped to a browser is public.

This site currently has no Gemini-powered feature or backend. A Gemini API integration that keeps its key private would require a server-side endpoint.

## Browser-only admin limitations

The staff PIN is a convenience gate, not secure authentication. It is present in the frontend source, and records are stored locally on the device. Do not use this version to manage confidential member information or as a shared multi-user admin system.
