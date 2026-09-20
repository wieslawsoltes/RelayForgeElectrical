# RelayForge Electrical

A modular electrical CAD application written in plain HTML, CSS and JavaScript. The browser editor has no framework runtime. A self-contained ESM Worker serves the application and a revisioned SQL-backed API. A zero-runtime-dependency Node 24 server runs the same application locally with SQLite.

**Version 0.2.1 adds a GitHub Pages build with browser-local storage. Version 0.2.0 added engineering, cabinet and interchange modules with operation-based collaboration. It is not full EPLAN Electric P8 parity or a qualified production engineering system.** See [Compatibility](docs/COMPATIBILITY.md) for exact boundaries. Original code and symbol artwork; no EPLAN assets, project libraries or proprietary binary formats are included.

## GitHub Pages demo

The `GitHub Pages` workflow publishes the editor at https://wieslawsoltes.github.io/RelayForgeElectrical/ once Pages is enabled for GitHub Actions in repository settings. Projects, comments and the latest 100 revisions are saved only in the current browser; other tabs in that browser receive saved edits. There are no remote accounts or invitation links in this static edition. The server-backed application and all seven standalone packages remain included. See [Pages build, storage and deployment](docs/GITHUB-PAGES.md).

```sh
npm run build:pages
python -m http.server 8080 --directory dist-pages
```

## Run the application

Requires **Node.js 24 or newer** (the standalone server uses `node:sqlite`). No dependency installation is needed to run, build, or test the application from the source archive.

```sh
npm start
```

Open **http://127.0.0.1:8787**. The local server creates `.data/relayforge.sqlite` and applies checked-in schema migrations. It uses one local development identity and binds to loopback by default. Do not expose this development server to an untrusted network.

```sh
npm test             # core, collaboration and real SQLite API integration tests
npm run build        # produces dist/server/index.js and migration bundle
npm run validate     # verifies the bundled Worker export
npm run pack:libs     # produces seven independent npm tarballs in artifacts/
```

The Worker bundle is generated; edit `app/`, `packages/` and `server/`. `npm start` and `npm run build` regenerate it.

To change the database schema, install the locked development tools with `corepack pnpm install --frozen-lockfile`, then run `pnpm db:generate`. Review the generated SQL. Applied migrations are immutable.

## Editor workflows

- Open a six-page conveyor control sample, or create projects and schematic, cover, terminal, layout and overview pages.
- Place 80 original electrical symbol definitions; edit tags, function/location, ratings, parts and coordinates.
- Select, box-select, move, nudge, rotate, copy, paste, duplicate, align, delete, undo and redo objects.
- Draw orthogonal connections with pin snapping, manually placed junctions, conductor attributes and numbering.
- Navigate pages and devices, filter the symbol catalog, follow related function cross-references, inspect properties.
- Check for disconnected pins, sparse connections, conflicting potentials, missing tags/parts and selected duplicate functions.
- Generate parts, device, connection, terminal and PLC reports; export tables as CSV.
- Save and reuse selected circuits as window macros within a project.
- Export/import RelayForge JSON, export individual pages as SVG, and print the complete project through the browser's PDF/printer facilities.
- Switch light/dark themes, show/hide panels, toggle grids and pins, pan and zoom at the pointer.
- Save to a durable server database, retain revision history, restore revisions, add/resolve comments, invite editors/viewers, and review concurrent field edits.

Keyboard shortcuts are available from View → Shortcuts or `?`. `V`: select; `W`: wire; `P`: symbol; `T`: text; `R`: rotate; `F`: fit; `G`: grid; Space+drag: pan. Standard copy, paste, undo, redo, delete and save shortcuts work.

## Engineering additions

- Engineering ribbon: 51 typed properties; main-function and part inheritance; multilevel terminal positions, jumper groups, feedthrough/disconnect states; project-wide potential/interruption networks; semantic diagnostics.
- Calculation forms: DC/single-phase/three-phase voltage drop, adiabatic withstand, corrected ampacity/protection and rectangular duct fill. Inputs and assumptions are saved with results. These are engineering screening calculations, not certified calculations.
- Automation ribbon: scoped PLC variables; PLCopen XML 2.01 declarations, Rockwell TAG/ALIAS CSV and L5X scalar tags, AutomationML APC tag interfaces. The original source is retained on import. Unsupported data types and structures are explicitly rejected or documented.
- Manufacturing ribbon: editable 3D enclosure/component volumes, collision checks, 3D A* wire routes, route length and cut allowance, stale-route detection, mounting schedule and millimetre DXF. Fabrication outputs require manufacturer geometry and engineering review.
- Windows companion: validated EPLAN action jobs for project export/import, backup/restore, macro generation and PLC exchange. Requires the user’s installed, licensed EPLAN runtime. It does not decode native formats in the browser. See [Native bridge](docs/NATIVE-BRIDGE.md).

The physical-renderer evidence runner is served at `/examples/qualification.html`. Run it on the intended HTTPS or localhost workstation; see [Qualification](docs/QUALIFICATION.md).

## Independent packages

| Package | Responsibilities | Dependency |
|---|---|---|
| `@relayforge/core` | Project schema, transactions, symbol registry, graph connectivity, reports, validation, merge | None |
| `@relayforge/renderer` | Canvas/WebGPU scene rendering, transforms, culling, SVG export | Core |
| `@relayforge/controls` | Project tree, property grid and data table custom elements, icons, optional CSS | None |
| `@relayforge/collaboration` | Durable operation outbox, field merge, SSE synchronization | Core |
| `@relayforge/engineering` | Typed properties, project networks, terminal semantics, calculation traces | Core |
| `@relayforge/interchange` | PLCopen, Logix CSV/L5X and AutomationML tag adapters | Core |
| `@relayforge/cabinet` | Millimetre geometry, collision checks, 3D routing, DXF, Canvas/WebGPU 3D | Core |

Each package has its own manifest, exports and MIT license. `npm run pack:libs` creates installable archives; npm publication is not performed automatically. See [API documentation](docs/API.md) and the runnable [standalone example](examples/index.html), served at `/examples/index.html`.

## Collaboration and hosting

The hosted app uses a logical D1 binding named `DB`. Authentication comes from trusted platform headers and authorization is checked for every project API request. Membership roles are owner, editor and viewer. Invitation links grant project membership; **they do not change the hosting site's access policy**. A private owner-only deployment remains owner-only until its audience is changed through the hosting platform.

The default client sends durable, idempotent operations after a 250 ms debounce. Changes to different properties of the same device merge. Conflicting field values require review. Server-sent events notify the browser of revisions; the hosted stream checks the SQL database every 750 ms and rotates after 18 ticks to stay within query budgets. This is not distributed push, a character CRDT, or WebSocket transport. Pending packets survive browser reloads in an identity-scoped outbox. The database is authoritative; legacy polling is available only from the explicitly named legacy module.

The source contains a Sites deployment manifest for this specific deployment. When moving to a separate hosting project, create a new identity rather than reusing another deployment's project ID. Other Worker hosts can run `dist/server/index.js` after provisioning `DB` and applying `drizzle/*.sql`. A trusted identity gateway must strip client-supplied authentication headers before adding its own.

## Documentation and validation

- [Architecture and storage](docs/ARCHITECTURE.md)
- [Public JavaScript API](docs/API.md)
- [Feature compatibility and limitations](docs/COMPATIBILITY.md)
- [Validation record](docs/VALIDATION.md)

The CI workflow builds, tests and packages libraries. An optional manually dispatched workflow publishes the packages using a repository `NPM_TOKEN` secret. No npm publication runs automatically. Generated Worker bundles, Pages output and package archives are produced by CI rather than committed to source control.
