# {{ PROJECT_TITLE }}

A standalone, runnable Global Payments sample project. Generated deterministically
by the Lego system Builder — no monorepo dependencies, everything is vendored.

## Components

{{ COMPONENT_TABLE }}

## Sequence of operations

{{ SEQUENCE }}

## Configuration

Copy `.env.example` to `.env` and fill in your sandbox credentials from
[developer.globalpayments.com](https://developer.globalpayments.com):

{{ CONFIG_VARS }}

## Run it

```bash
npm install
npm start        # http://localhost:3000
npm test         # sandbox integration tests (skip cleanly without credentials)
```

Sandbox test card: `4263 9700 0000 5262`, any future expiry, CVV `123`.
