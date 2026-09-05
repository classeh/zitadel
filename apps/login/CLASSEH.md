# Classeh fork of the ZITADEL login app

Persian-only login for Classeh, branched from `v4.17.2`.

## Build order

`pnpm install` alone is not enough — the login app depends on two workspace
packages that must be generated and built first. Skip them and the build fails
with dozens of `module-not-found` errors pointing at the app's own files, never
naming the package that was missing.

```bash
corepack prepare pnpm@10.30.3 --activate
pnpm install --frozen-lockfile
cd packages/zitadel-proto  && pnpm generate   # protobuf codegen, buf comes from node_modules
cd ../zitadel-client       && pnpm build      # tsup
cd ../../apps/login        && pnpm build
docker build --platform linux/amd64 \
  -t docker.fanavar.dev/fanavar/zitadel-login:v4.17.2-classehN -f Dockerfile .
```

## What changed, and why each was necessary

| File | Change |
|---|---|
| `locales/fa.json` | 297 keys, 147 translated. Wording taken from the Keycloak theme's `messages_fa.properties`, so users meet the same words they already know. |
| `src/lib/i18n.ts` | `LANGS` holds Persian alone. |
| `src/i18n/request.ts` | Fallback locale is `fa`, and the server's default language is only honoured if this build actually ships it. |
| `src/app/(login)/layout.tsx` | `dir="rtl" lang="fa"`; language switcher hidden when there is only one language; Lato replaced with local Estedad. |
| `src/styles/classeh.scss` | The look of core-app's login page. |
| `public/fonts/` | Estedad, the three weights core-app uses. |

### The server cannot fix the language, only this build can

ZITADEL rejects `fa` outright: `PUT /admin/v1/languages/default/fa` answers
`Language is not supported (LANG-lg4DP)`, and the same list gates the allowed
languages. The hosted-login-translation API *does* accept and store `fa`, and
serves it correctly — verified with the login client's own PAT from inside the
container — but the app never applies it, so that route is a dead end. Hence
the fork.

`request.ts` needed the second change for a subtle reason: `defaultLanguage`
comes from the instance and is **not** filtered against `LANGS`. An instance
saying `en` therefore selected a language this build does not contain, and the
page stayed English while Persian was the only option available.

### Styling

Every value in `classeh.scss` comes from `core-app`'s `login-form.tsx` or the
earlier Keycloak port, not from eyeballing: navy `#0A4471`, teal `#03A7A0`,
shell `#fafafa`, card `rounded-[30px]` with `bg-white/20` and a backdrop blur,
button 53px tall and fully rounded, inputs `rounded-[14px]`. The two corner
"bulbs" are the same SVGs core-app renders as components, inlined as data URIs.

No ZITADEL component is overridden. The worst an upstream change can do is make
a rule inert, not break the page.

One rule has no counterpart in the Keycloak theme: username, email and code
inputs are forced `direction: ltr`. On an RTL page `09123456789` renders
reversed — typed correctly, but the user reads it as wrong.

### Fonts

`next/font/local`, not `next/font/google`. Lato is a Latin face and wrong for
Persian, and `next/font/google` downloads at build time — which from Iran means
a build that works some days and not others. The files are in the repo and the
build is offline.
