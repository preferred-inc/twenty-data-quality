# Data Quality — a Twenty app

Scores how completely the records in your [Twenty](https://twenty.com) workspace are filled in, worst first.

**Zero configuration.** It reads the Metadata API at runtime, so every object and field in *your*
workspace is picked up automatically — including custom ones. There is no list of fields to maintain.

**Read-only.** The role it ships with grants read access and nothing else. It never writes, deletes,
or changes settings.

## What it shows

- **Overall completeness** — weighted by how many values each object actually contributes, so an
  object with 3 records cannot swing the score as hard as one with 500
- **Per object** — a bar per object, sorted worst first, expandable into a per-field breakdown
- **Worst fields across the workspace** — the ten fields most likely to be worth a bulk fix

## What it does *not* score, and why

Getting this wrong is what makes a naive completeness score useless:

| Excluded | Why |
|---|---|
| `BOOLEAN` fields | `false` is a real answer. There is no way to tell it apart from "never set". |
| One-to-many relations | A company with no notes is not a defect, it is a company with no notes. |
| System fields (`id`, `createdAt`, `position`, `searchVector`, actors …) | Twenty manages them; a human never fills them in. |
| `name` | Effectively required, so it is always 100% and only dilutes the score. |

It also walks *into* composite fields. Twenty returns `CURRENCY`, `LINKS`, `EMAILS`, `PHONES`,
`ADDRESS`, `FULL_NAME` and rich text as objects whose sub-fields are present but null — so a plain
null check reports an empty currency field as filled. This does not:

```ts
isEmptyValue({ amountMicros: null, currencyCode: null }); // true
isEmptyValue({ amountMicros: 1_000_000, currencyCode: 'JPY' }); // false
```

Many-to-one relations are resolved through their `<name>Id` key, which is what the REST API returns.

## Install

```bash
nvm use            # Node ^24.5.0
yarn install
yarn twenty remote:add <name> --url https://your-twenty.example.com --api-key <key>
yarn twenty apply -f
```

The app appears in the navigation as **Data Quality**.

## Development

```bash
yarn test:unit     # unit tests for the scoring rules
yarn typecheck
yarn lint
```

The scoring rules live in [`src/lib/quality.ts`](src/lib/quality.ts) as pure functions with no I/O,
so they are covered by tests without a running Twenty instance.

## Sampling

Up to 200 records per object are read. On larger workspaces the score is a sample rather than a
census — accurate enough to rank fields, not a compliance report.

## License

MIT © Preferred Inc.
