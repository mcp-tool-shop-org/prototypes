# Phase 1 — Repo bootstrap + build green (Commits 1–5)

> Goal: unzip starter, build on Linux, run the app, establish CI + dev workflow.

## Prereqs (Linux)
- [ ] Install .NET SDK 8.x (`dotnet --version`)
- [ ] (Optional) Install `git`
- [ ] Confirm you can run a GUI app (desktop session, not pure server TTY)

## Unpack + initialize repo
- [ ] Unzip `linux-dev-typer-starter.zip` into a new folder named `linux-dev-typer/`
- [ ] `cd linux-dev-typer`
- [ ] `git init`
- [ ] `git add -A`
- [ ] `git commit -m "chore: import linux-dev-typer starter"`

---

## Commit 1 — `chore: import linux-dev-typer starter`
- [ ] Confirm files exist:
  - [ ] `linux-dev-typer.sln`
  - [ ] `src/LinuxDevTyper.Core/`
  - [ ] `src/LinuxDevTyper.App/`
  - [ ] `assets/snippets/`
  - [ ] `docs/`
- [ ] Confirm `VERSION.txt` and `CHANGELOG.md` exist

## Commit 2 — `build: restore + build release`
- [ ] `dotnet restore`
- [ ] `dotnet build -c Release`
- [ ] Fix any SDK or package version issues until build succeeds
- [ ] `git commit -am "build: restore + build release"` (or add/commit relevant changes)

## Commit 3 — `feat: run target + smoke test`
- [ ] Run:
  - [ ] `dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj`
- [ ] Smoke checks:
  - [ ] Window opens
  - [ ] "New Test" changes prompt
  - [ ] Typing updates stats (WPM/accuracy/errors)
  - [ ] Sidebar ⚙ collapses/expands
- [ ] Commit any small fixes.

## Commit 4 — `chore: editor + formatting defaults`
- [ ] Add `.editorconfig` with sane defaults (C# formatting, newline LF)
- [ ] Ensure `dotnet format` (optional) won’t thrash files
- [ ] Commit: `git commit -m "chore: editorconfig + formatting defaults"`

## Commit 5 — `ci: enable ubuntu build workflow`
- [ ] Verify `.github/workflows/build.yml` exists
- [ ] Ensure it builds both projects on `ubuntu-latest`
- [ ] Commit: `git commit -m "ci: build workflow for ubuntu"`

---

## Phase 1 Exit Criteria
- [ ] `dotnet build -c Release` succeeds on Linux
- [ ] App launches and is usable at basic level
- [ ] CI builds on Ubuntu (or at least workflow present and valid)
