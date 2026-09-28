import dotenv from 'dotenv';

// .env into process.env, before config.ts parses it. Quiet: since dotenv 17
// every load writes "injected env (n) from .env" to the terminal — with no
// .env too — and in Docker that is a line of prose in a stream of JSON logs.
dotenv.config({ quiet: true });
