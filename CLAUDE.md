# Constellation UI Gallery

Pega Constellation DX components: React 18 + TypeScript, rendered inside a Pega
Infinity app. Each component is a folder under `src/components/` that the
`@pega/custom-dx-components` CLI builds and publishes to a Pega server.

For anything about how a component is structured or talks to the platform, load
the `pega-dx-contract` skill. The summary below is the rules, not the detail.

## Layout

- `src/components/Pega_Extensions_<Name>/` — one component. Folder name, `name`
  and `componentKey` in its `config.json` are the same string.
- `src/components/shared/platform/` — typed facade over `PCore`/`PConnect`
  (`createPlatform`) and its test double (`installPlatformFake`).
- `src/components/shared/create-nonce.ts` — CSP nonce shim every `index.tsx` imports.
- `tools/generator/` — spec-driven generator for all three types (`defineField`,
  `defineTemplate`, `defineWidget`).
- `tools/config-parity/` — checks every `config.json` property is read by the component.
- `.storybook/` — Storybook 10 with Cosmos themes; it is the local dev environment.

There are three component types: **Field** (binds one property), **Template**
(lays out regions of other fields/views), **Widget** (standalone, on a page or a
case). Check `type` in `config.json` before changing a component.

## Rules

1. **New components start from the generator**, whatever the type:
   `npm run generate -- tools/generator/specs/<name>.<field|template|widget>.ts`.
   The `new-dx-component` skill has the whole workflow. Never hand-write
   `config.json` and the props type separately — that is how they drift.
2. **No `PCore` outside `shared/platform`.** Go through `createPlatform(getPConnect)`.
   If the API you need is missing, add it to `types.ts`, `index.ts` and `fake.ts`
   together. 36 runtime files across 28 components still reach `PCore` directly;
   do not copy them. The `platform-facade` skill has the procedure and a coverage map.
3. **Stories and tests use `installPlatformFake`**, not a hand-rolled
   `window.PCore = {...}` stub. 42 older stories still have one; do not copy them.
4. **Every `config.json` property must be read by the component.**
   `tools/config-parity/known-drift.json` only ever shrinks — remove an entry when
   you fix it, never add one.
5. Leave `buildDate`, `infinityVersion` and `packageCosmosVersion` in
   `config.json` alone; the build writes them.
6. User-facing strings go through `getPConnect().getLocalizedValue()` with the
   source text in `localizations.json`.
7. Use Cosmos (`@pega/cosmos-react-*`) components and theme tokens before custom
   markup or hard-coded colours. Styling is styled-components v5 in `styles.ts`.

## Verify

Run these for any component change, scoped to the folder where possible:

```bash
npm run lint:types                                   # tsc --noEmit
npx eslint src/components/Pega_Extensions_<Name>
npx jest src/components/Pega_Extensions_<Name>
npx jest tools                                       # config parity + generator
```

Then Pega's own build: config schema, lint and bundle. It is local and contacts
no server. Given the component and two answers it does not prompt:

```bash
npx custom-dx-components buildComponent Pega_Extensions_<Name> N N </dev/null
git checkout -- store && git clean -fdq store   # the build rewrites the tracked archive
```

The bundle type-checks every file `tsconfig.build.json` includes, so a type
error anywhere under `src` fails it, not only in the component being built.
`npm start` launches Storybook on port 6006.

## Conventions

- Named export `PegaExtensions<Name>` plus `export default withConfiguration(PegaExtensions<Name>)`.
- Story titles are `Fields/<Name>`, `Templates/<Name>` or `Widgets/<Name>`.
- Tests render stories through `composeStories`, so a story is also a fixture.
- Node 24. Commit messages follow Conventional Commits (`feat(tools): …`).
