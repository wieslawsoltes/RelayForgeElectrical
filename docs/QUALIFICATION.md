# Qualification evidence and reproducible checks

Qualification must name an intended workload, platform and acceptance criteria. This repository supplies implemented algorithms, reference tests and repeatable evidence tools. It does not claim certification.

## Executed checks

Run `npm test` for the automated model, geometry, interchange, recovery and real SQLite tests. Run `npm run test:load` for the 32-client / 640-operation contention case; the script asserts every final field, revision and journal count and writes `docs/LOAD-TEST.json`. Run `node scripts/benchmark.mjs` for CPU model/scene preparation timings. These tests use Node 24 and local SQLite, not the deployed D1 service.

PLCopen generated fixtures were validated using the official PLCopen 2.01 XSD, downloaded independently for validation and not redistributed. The all-supported-types, empty-project and duplicate-name/different-scope cases passed. Prefix-qualified XML and an LD operand-reference fixture were imported correctly. Schema validity does not establish target engineering-tool acceptance.

## Physical rendering

Run `npm start` and open `http://127.0.0.1:8787/examples/qualification.html` on each intended workstation. Click Run renderer checks. Inspect the drawing and cabinet, record the physical GPU/driver/browser/OS separately, and download the evidence JSON. The runner records reported adapter information, backend, secure-context state and 20 timing samples for 100 and 1,000 placements. GPU completion timing awaits queue completion where WebGPU is active; Canvas-only runs are explicitly labelled.

Test pan/zoom, resize, multiple monitors, high-DPI, WebGPU device loss and fallback on representative large documents. A browser reporting WebGPU does not by itself prove the adapter is a physical GPU; operator hardware identification is required. This environment's browser preview used the Canvas fallback, so no hardware WebGPU performance result is supplied.

## Native/vendor interoperability

On licensed Windows workstations, use the companion dry run first, then execute against copied native projects with representative macros, connection definitions, PLC hardware and multilingual properties. Open each result in the intended engineering tool, compare inventories and properties, and retain tool/version logs and warnings. The current browser model does not map every native object or vendor structure, so lossless whole-project interchange is not an acceptance claim.

## Electrical/manufacturing acceptance

Supply the applicable jurisdiction, standard edition, installation method, conductor/insulation data, protective-device curves, enclosure/component manufacturer geometry, machine tooling and acceptance tolerances. Compare each supported numerical method against independent reference calculations over boundary cases. Have the responsible qualified engineer approve the actual design and fabrication package. Generic bounding boxes and stored formulas cannot establish certification.

Primary method references: [voltage drop](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions), [adiabatic withstand](https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions), [cable-sizing method](https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing). Vendor interchange reference: [Rockwell import/export manual](https://literature.rockwellautomation.com/idc/groups/literature/documents/rm/1756-rm014_-en-p.pdf).
