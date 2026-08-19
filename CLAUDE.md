# WillCal

A web calendar application: a React + TypeScript browser client talking to a Node server over a single JSON-RPC endpoint (`POST /rpc`). The server owns the SQLite database; the browser never touches the filesystem. Redux manages client state. Features drag-and-drop scheduling with week/month/agenda views, gated behind a shared password.

See `AGENTS.md` for the architecture, the RPC method table, and configuration.

## Notes for Claude

- Every time we add a new feature that is in the UI, you should add a block to `Testing.md` with manual testing steps for me to follow
- Always run `npm run build` after making code changes. esbuild does not typecheck, so run `npm run typecheck` too.
- Never import from `src/server/**` in client code. Shared types go in `src/shared/`.
- New server functionality means a validated method in `src/server/methods.ts` plus a typed wrapper in `src/client/api.ts`.
