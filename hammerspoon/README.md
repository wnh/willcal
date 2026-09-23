# WillCalNow.spoon

A [Hammerspoon](https://www.hammerspoon.org) Spoon that shows the title of the
WillCal block covering right now in the mac menubar, by polling `GET /now`.

```
Write the report (36m)
```

Nothing scheduled shows `idle`. The last few minutes of a block turn red. The
menubar item's menu shows the category, the block's start and end in local
time, and offers Refresh, Copy title, Open WillCal, and Pause updates.

## Install

```bash
mkdir -p ~/.hammerspoon/Spoons
cp -R hammerspoon/WillCalNow.spoon ~/.hammerspoon/Spoons/
```

Then in `~/.hammerspoon/init.lua`:

```lua
hs.loadSpoon("WillCalNow")
spoon.WillCalNow:start({
  url = "http://127.0.0.1:8080",
  password = os.getenv("WILLCAL_PASSWORD"),
  interval = 30,
})
spoon.WillCalNow:bindHotkeys({ refresh = { { "cmd", "alt" }, "n" } })
```

Reload the config (`Hammerspoon > Reload Config`).

`password` is the shared `WILLCAL_PASSWORD`. Keep it out of a config file you
would commit or share: read it from the environment as above, or from the login
keychain with
`select(1, hs.execute('security find-generic-password -s willcal -w')):gsub('%s+$', '')`.

## Configuration

Pass any of these to `start()` (or `configure()`, or assign them directly):

| Field | Default | Purpose |
| --- | --- | --- |
| `url` | `http://127.0.0.1:8080` | Server base URL, no trailing slash |
| `password` | *(required)* | The shared password |
| `interval` | `30` | Seconds between polls |
| `maxTitleLength` | `28` | Block title is elided past this |
| `showTimeRemaining` | `true` | Append `(36m)` to the title |
| `warnMinutes` | `5` | Turn the text red inside this many minutes; `0` disables |
| `idleTitle` | `idle` | Text shown when nothing is scheduled |

## How it authenticates

`/now` requires the same signed session cookie as `/rpc`. The Spoon posts
`session.login` to `/rpc`, keeps the `willcal_session` cookie in memory, and
re-signs in whenever the server answers `401` (which is what a cookie expiring
mid-session looks like). The cookie is never written to disk, so a Hammerspoon
restart means one fresh sign-in.

Over anything other than localhost the server must be behind TLS, or started
with `WILLCAL_ALLOW_INSECURE_COOKIE=1`, or it will not issue a usable cookie.

## When something is wrong

The menubar shows `WillCal ?` and the reason is in the tooltip and the first
menu item:

| Text | Meaning |
| --- | --- |
| `server unreachable` | Nothing listening at `url` |
| `no password configured` | `password` was nil or empty |
| `sign-in rejected` | Wrong password, or the login rate limit is in effect (10 failures per 15 minutes) |
| `no session cookie` | Signed in but no cookie came back; see above about TLS |
| `not signed in` | 401 immediately after a successful sign-in |

`hs.console` carries more detail.
