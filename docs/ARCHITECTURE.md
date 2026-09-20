# Architecture

## Separation of concerns

The `core` package is DOM-free and can run in a browser, Node or an ESM Worker. A project contains pages and each page contains identifiable symbol placements, routed conductor segments and text annotations. Device identity is represented by structured function, location and tag properties. A symbol definition is a set of polyline/rectangle/circle/text primitives plus named pin coordinates.

`ProjectStore` applies synchronous transactions with validation and before/after snapshots. Invalid transactions roll back. Undo and redo are bounded to 100 entries. This provides simple deterministic recovery; full snapshots increase memory use for very large projects. Remote replacement clears local undo history so undo does not blindly overwrite another user's revision.

The graph builder creates nodes for transformed pins and wire route points. Route points belonging to one wire are joined. Coincident points and endpoints lying on other conductors join using a spatially indexed candidate search. Interior crossings without a junction remain separate. Explicit junction pins connect crossing segments. Passive device electrical behavior is not simulated; connectivity describes wiring up to pins. Device contact state, motor load, fault currents and protection coordination are outside the graph's remit.

Reports are derived from current project records, not separately maintained totals. Parts consolidation uses device structure/tag and part number; terminal positions distinguish separate terminals. Related function references match function, location and tag. These rules cover the provided model and are not exhaustive EPLAN semantics.

## Rendering

`pageScene` produces line and label primitives for the sheet border, zones, title block, electrical symbols, conductor routes and annotations. The same scene feeds SVG export and the live renderer.

The live renderer uses three layers: a Canvas background for paper/grid, WebGPU for batched line segments, and a Canvas overlay for text, selection and interaction. WebGPU uses one instanced triangle-list draw per visible line batch, a camera uniform, a reusable vertex buffer, four-sample MSAA and viewport culling. Text remains Canvas-rendered. The renderer schedules a frame only when invalidated and limits backing resolution to 2× device pixel ratio. It detects unavailable adapters and device loss and falls back to Canvas lines.

This is a hybrid renderer; it is not an all-GPU text/vector engine. `frameMs` measures JavaScript render submission, not GPU completion or end-to-end frame latency. Physical GPU testing and graphics-driver coverage remain outstanding.

## Controls and app

`rf-tree`, `rf-property-grid` and `rf-data-table` are independent custom elements using light DOM. They expose data setters and bubbling selection/property events. A separate CSS file provides an optional default appearance. Applications can supply their own CSS.

The app composes these controls with native HTML buttons, inputs and dialogs. A shared command map is used by the ribbon, keyboard shortcuts, command finder and floating drawing toolbar. Entity edits update the core store, redraw the scene and queue a durable save. Pins attached to moved devices cause corresponding wire endpoints to follow; complex route cleanup still requires manual editing.

The app supports pointer capture, wheel zoom, keyboard pan, selection boxes, keyboard nudging and responsive panel removal. It does not include native multiwindow docking, pen gesture recognition or a complete screen-reader equivalent of the drawing canvas.

## Durable storage and API

Database tables:

| Table | Purpose |
|---|---|
| `projects` | Current JSON document, revision, owner, name and update timestamp |
| `members` | Project membership and owner/editor/viewer role |
| `revisions` | Immutable document snapshots and author/timestamp |
| `comments` | Project/page/entity comments and resolved state |
| `presence` | Latest heartbeat per project/user |
| `invites` | SHA-256 invitation token hashes, role and expiration |
| `operations` | Idempotent operation receipts, hash, change list and revision |
| `tombstones` | Globally deleted object IDs and deletion revision |

The core validates document structure before writes. Queries use prepared parameters. A document save is a conditional update with `WHERE revision = expected`. Update and revision insertion execute in one SQL batch transaction; only a successful update creates history. Stale writes return the current remote revision and document with HTTP 409. The client merges nonoverlapping field edits and pauses on same-field conflicts.

Authentication reads `oai-authenticated-user-id` from the trusted hosting gateway. Every project endpoint verifies membership. Mutation endpoints require editor/owner; invitation and membership management require owner. Browser mutation requests reject foreign Origin headers. The service does not implement a public login/password system. The standalone local server forcibly assigns a local identity, so it is suitable for local development only.

Invitations contain two random UUIDs and expire after 24 hours. Only hashes are stored. An invitation may be reused until expiry and has no individual revocation UI. Removing a member invalidates all outstanding project invitations, preventing re-entry using an old link. Rate limiting, audit retention policy, encrypted revision payloads, configurable project quotas, compliance controls and organization administration are future work.

## Synchronization and recovery

The default transport uses a 250 ms operation debounce and SSE revision notices. The hosted SSE implementation tails SQL revision state every 750 ms, emits presence on six-tick intervals, and rotates after 18 ticks. It consumes at most 43 application queries including the initial membership check. This avoids four-second client polling, but remains a bounded SQL-tail transport, not distributed event push.

Field preconditions allow disjoint edits to the same entity to merge. ID collections receive granular field operations; collection reordering is atomic and can conflict. Concurrent same-field writes and deletion/edit conflicts require review. SQL compare-and-swap and immutable operation receipts prevent duplicated commits. Global tombstones prohibit replaying deleted identities through nested array replacement. Undo/redo and historical restoration renew reintroduced identities and their references.

Local storage retains base, pending document, exact packet, packet document and revision, scoped to authenticated user and project. Lost acknowledgments replay the original receipt first. Subsequent local edits are rebased onto the server response. Browser storage quota and offline project switching remain practical constraints; this is not a general multi-project offline database.

## Build and deployment

`bundle.mjs` embeds app source assets and the validated server/core code into one ESM Worker. No application framework or bundler is required. The build copies the Worker, manifest and generated Drizzle migrations into `dist`. Static assets are served from the embedded map with MIME types, no-sniff and a restrictive same-origin content policy.

`server/local.mjs` adapts Node HTTP requests to Fetch requests and provides a D1-like prepared statement adapter using Node's built-in SQLite. `tests/server.test.js` exercises this SQL adapter against the real generated schema. This validates SQL semantics locally, not Cloudflare's full production environment.

## Cabinet and engineering modules

`engineering` adds an extensible typed property catalog, restricted inheritance, terminal physical positions/levels/jumpers, named project networks and calculation functions returning inputs, formula and assumptions. These are a documented subset, not EPLAN's complete property semantics.

`cabinet` maintains independent millimetre geometry. A* searches six-axis grid neighbours with component collision expansion and a duct cost preference. Budgets cap grid and visited-node work. Routes have front-centre ports, geometric length and explicit slack. Bounds, component collisions, cable radius and stale endpoints are checked before output. No bend-radius, thermal, EMC, machining or electrical standard conformance is implied.

`CabinetRenderer` has an orthographic 3D camera, orbit/zoom and selection. Its WebGPU module builds box/cable meshes, transforms vertices in WGSL, uses depth testing and 4× MSAA. Canvas face rendering is the fallback. Schematic rendering remains the separate instanced-line engine. Neither physical GPU path has been qualified in this environment.

`interchange` uses a bounded XML parser with namespace resolution, ordered mixed text, entity restrictions and node/depth/byte limits. It maps PLC declarations/tags; original source is retained. It does not compile or execute PLC programs. The native Windows bridge invokes documented EPLAN actions as argument arrays without a shell.
