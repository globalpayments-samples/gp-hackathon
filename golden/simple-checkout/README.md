# Simple checkout

A standalone, runnable Global Payments sample project. Generated deterministically
by the Lego system Builder — no monorepo dependencies, everything is vendored.

## Components

| Component | Layer | Description |
| --- | --- | --- |
| Tokenization helper | stud | Mints the scoped access token the Hosted Fields frontend needs for client-side tokenization |
| Charge | brick | Single-step authorization and capture of a tokenized card |
| Hosted Fields | tile | Secure card-entry iframes rendered inside the branded checkout page |

## Sequence of operations

1. **Tokenization helper** — Mints the scoped access token the Hosted Fields frontend needs for client-side tokenization.
2. **Charge** — Single-step authorization and capture of a tokenized card.
3. **Hosted Fields** — Secure card-entry iframes rendered inside the branded checkout page.

## Configuration

Copy `.env.example` to `.env` and fill in your sandbox credentials from
[developer.globalpayments.com](https://developer.globalpayments.com):

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

## Run it

```bash
npm install
npm start        # http://localhost:3000
npm test         # sandbox integration tests (skip cleanly without credentials)
```

Sandbox test card: `4263 9700 0000 5262`, any future expiry, CVV `123`.
