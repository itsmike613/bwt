# BedWars

The authoritative project rules are in `spec.md`. Current implementation state is in `status.md`.

## Run locally

Serve this folder over HTTP (ES modules and pointer lock should not be tested from `file://`). One simple option is:

```sh
python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html` for the public application shell.
- `http://localhost:8000/editor.html` for the shared-core map editor.

## Hosting

The client is static and uses relative project paths so it can be hosted from a GitHub Pages repository subpath. Three.js is pinned in the page import maps. Firebase is intentionally not configured in the first foundation slice.
