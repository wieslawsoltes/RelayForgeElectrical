# JavaScript API

All seven packages are ESM. In a source checkout, use relative imports as below. Installed packages can use their `@relayforge/*` names.

```js
import {createProject,createEntity,createWire,ProjectStore,
  buildConnectivity,validateElectrical,bomReport,numberWires}
  from './packages/core/index.js';

const store = new ProjectStore(createProject('Machine 01'));
store.transact('Add start circuit', project => {
  const page = project.pages[0];
  page.entities.push(createEntity(project,'push_no',300,250));
  page.entities.push(createEntity(project,'coil',300,400));
  page.wires.push(createWire([{x:300,y:282},{x:300,y:368}]));
  numberWires(project,101);
});
store.addEventListener('change', event => console.log(event.detail.label));
console.log(buildConnectivity(store.project.pages[0]));
console.log(bomReport(store.project));
console.log(validateElectrical(store.project));
store.undo();
store.redo();
```

Important core exports include `createPage`, `getSymbol`, `registerSymbol`, `symbols`, `getPins`, `transformPoint`, `hitTest`, `validateProject`, `connectionsReport`, `terminalReport`, `plcReport`, `crossReferences`, `toCSV`, `mergeProjects`, `clone`, `uid` and `snap`.

Coordinates are drawing units. Entity rotation is in degrees. Wire points are ordered `{x,y}` objects; use explicit orthogonal vertices. Electrical connectivity is based on geometry/pins, and unmarked interior crossings do not join.

## Custom symbols

```js
import {registerSymbol} from './packages/core/index.js';
registerSymbol({id:'my-relay',name:'Custom relay',prefix:'K',category:'Custom',
  pins:[{id:'1',x:0,y:-30},{id:'2',x:0,y:30}],
  shapes:[{kind:'rect',x:-20,y:-15,w:40,h:30},
    {kind:'polyline',points:[0,-30,0,-15]},
    {kind:'polyline',points:[0,15,0,30]}]});
```

Definitions must be registered in every runtime that validates or renders those symbols, including the server. The stock import dialog does not load arbitrary external symbol-library files. Persist/register application-specific definitions in your integration explicitly.

## Renderer

```js
import {SchematicRenderer,exportSVG} from './packages/renderer/index.js';
const renderer = new SchematicRenderer(document.querySelector('#drawing'));
renderer.setDocument(store.project,store.project.pages[0]);
renderer.fit();
renderer.selected = new Set(['entity-id']);
renderer.invalidate();
renderer.zoom(1.2);
const svg = exportSVG(store.project,store.project.pages[0]);
// renderer.dispose() when the host is removed.
```

The host must have a nonzero width/height and `position:relative`. `view` contains `{x,y,scale}` in CSS screen coordinates. `screenToWorld` and `worldToScreen` transform points. `grid`, `showPins`, `preview`, `cursor` and `selected` configure overlays. Listen to `backend` for backend changes. `backend` reports `WebGPU` or `Canvas 2D`.

## Custom elements

```js
import {defineControls} from './packages/controls/index.js';
defineControls();
const tree=document.querySelector('rf-tree');
tree.data=[{id:'page-1',label:'Main supply',icon:'page',depth:0}];
tree.selected='page-1';
tree.addEventListener('itemselect',event=>console.log(event.detail.id));
const grid=document.querySelector('rf-property-grid');
grid.data={values:{tag:'-K1'},fields:[{key:'tag',label:'Device tag'}]};
grid.addEventListener('propertychange',event=>console.log(event.detail));
const table=document.querySelector('rf-data-table');
table.data=[{part:'RE-24DC',quantity:1}];
table.addEventListener('rowselect',event=>console.log(event.detail));
```

Import `@relayforge/controls/styles.css` for default styles or style the light-DOM elements yourself. Fields beginning with `_` are hidden from table columns and may carry navigation metadata.

## Collaboration client

```js
import {CollaborationClient} from './packages/collaboration/index.js';
const sync=new CollaborationClient({baseURL:'/api',
  onRemote: project => store.replace(project),
  onConflict: conflict => console.log(conflict.conflicts)});
const loaded=await sync.open(projectId);
store.replace(loaded.project);
// Suppress queueing during remote replacements in an actual integration.
sync.queue(store.project);
await sync.save();
sync.addEventListener('status',event=>console.log(event.detail));
// After explicit conflict review: await sync.resolve(chosenProject).
// Call sync.dispose() on teardown.
```

## HTTP API

All endpoints require a trusted authenticated user. Responses are JSON except the SSE event endpoint. Mutation requests use JSON and same-origin browser requests.

| Method | Route | Result |
|---|---|---|
| GET | `/api/me` | Current display identity |
| GET / POST | `/api/projects` | List member projects / create `{project}` |
| GET | `/api/projects/:id` | `{project,revision,role,presence}` |
| GET | `/api/projects/:id?since=N` | `unchanged` when no new revision |
| PUT | `/api/projects/:id` | Save `{project,revision}`; 409 on conflict |
| GET / POST / PATCH | `/api/projects/:id/comments` | List, create, resolve/reopen |
| GET / DELETE | `/api/projects/:id/members` | List / owner removes `{userId}` |
| POST | `/api/projects/:id/invite` | Owner creates `{role}` invitation |
| POST | `/api/join` | Join using `{token}` |
| GET | `/api/projects/:id/history` | Last 100 revision metadata records |
| GET | `/api/projects/:id/history/:revision` | Historical document |

A restore reads a historical document, runs `renewRestoredIdentities(current, restored)` and submits operations against the current revision. This preserves history and avoids reuse of tombstoned identities. Undo and redo use the same identity-renewal mechanism.

## Engineering and interchange

```js
import {voltageDrop, validateProperties, projectNetworks}
  from './packages/engineering/index.js';
const result = voltageDrop({system:'three-phase', voltage:400, current:32,
  lengthM:50, sectionMM2:10, resistanceOhmKM:1.83, powerFactor:.8});
console.log(result.dropV, result.assumptions);
import {exportPLCopen, importPLCopen} from './packages/interchange/index.js';
const xml = exportPLCopen(store.project, [
  {name:'Start',scope:'Main',dataType:'BOOL',address:'I0.0'}
]);
console.log(importPLCopen(xml).tags);
```

Properties are registered with `defineProperty({key,label,type,group,options})`.
`effectiveProperty(project, entity, key)` returns `{value,source}`. Function-specific identity/channel fields do not inherit. `validateProperties` returns semantic diagnostics without asserting certified compliance. `projectNetworks` joins feedthrough terminals, configured jumpers and matching interruption/potential declarations; it does not simulate energized states.

## Cabinet API

```js
import {createCabinet,addComponent,routeCabinet,cutList,mountingDXF}
  from './packages/cabinet/index.js';
import {CabinetRenderer} from './packages/cabinet/renderer.js';
const cabinet=createCabinet();
const a=addComponent(cabinet,{tag:'-Q1',x:40,y:40});
const b=addComponent(cabinet,{tag:'-K1',x:400,y:500});
cabinet.routes.push(routeCabinet(cabinet,{source:a.id,target:b.id,
  diameter:3,clearance:5,slack:.1}));
const view=new CabinetRenderer(document.querySelector('#cabinet'));
view.setCabinet(cabinet);
console.log(cutList(cabinet),mountingDXF(cabinet));
// view.dispose() on teardown.
```

All cabinet dimensions and lengths are millimetres. Components are axis-aligned volumes. Ports are currently front-face centres. `cutList` recomputes length and withholds cut length for missing/moved endpoints or invalid geometry. Estimates do not include validated connector insertion lengths, bend radii or manufacturing process compensation.

## Operation protocol

- `POST /api/projects/:id/operations`: `{operationId,baseRevision,changes}` from `diffProject(base,next)`.
- A change contains `path`, `before:{exists,value?}` and `after:{exists,value?}`. A path identifies array members by `{id}`.
- `GET /api/projects/:id/events?since=N`: SSE `ready`, `revision`, `presence`, `heartbeat`, `reconnect`, `access-revoked` events.
- `GET /api/projects/:id/journal?since=N`: up to 200 ordered operation records; continue from the highest revision.
- Duplicate operation IDs with matching payload hash are acknowledged once. Reused IDs with different content fail.
- The server compares field preconditions against the latest document, validates the result, and atomically commits the snapshot, operation receipt, revision and deleted-identity tombstones.
- Legacy PUT passes through the same operation transaction after its stricter revision check.
- `@relayforge/collaboration` exports the live client by default. The original polling client is explicitly available at `@relayforge/collaboration/legacy` for migration/testing.
- The live outbox is keyed by authenticated user and project. It replays uncertain receipts before merging subsequent edits. Permanent authorization/size failures pause retries; transient failures retain the same packet.
