# Validation record — 0.2.0

Environment: Linux, Node.js v24.19.0, built-in SQLite with the generated migrations. Browser: managed Chromium preview at 1363 × 936 CSS pixels, Canvas rendering backend.

## Automated evidence

**48 tests passed.** Coverage includes isolated wire crossings, explicit junctions, T connections, transformed pins, transaction rollback, undo/redo, bounded geometry, BOM, wire numbering, escaped SVG, project-wide terminal/interruption networks, property coercion and main-part inheritance; reference voltage-drop/adiabatic/ampacity/fill results; obstacle-aware 3D routing, cable-radius collision and stale cut instructions; PLCopen/Logix/AutomationML scoped round trips; bounded XML rejection; and native bridge argument generation.

SQL/client tests cover authentication, membership, viewer restrictions, comments, origin checks, invitation expiry/removal behavior, stale writes, same-device disjoint field merging, duplicate operation receipts, journal/history atomicity, global deletion tombstones including legacy PUT, SSE revision/presence delivery, lost-acknowledgment outbox recovery and undo after a committed deletion. Legacy-client tests remain for migration regression coverage.

The independent PLCopen schema check passed for all supported data types, empty exports and scoped declarations. Imported fixtures also covered an LD contact operand and namespace prefixes. The schema was not bundled due to redistribution uncertainty.

The local contention run committed **640 operations from 32 simultaneous clients**, reached revision **641**, and asserted **zero lost updates** and the complete operation journal. Observed p50 **51.36 ms**, p95 **81.22 ms**, p99 **90.14 ms**, approximately **555 commits/second** in this one-process SQLite run. See `LOAD-TEST.json`; these are not cloud or physical GPU performance claims.

## Browser and visual evidence

Executed through the supported browser interface:

- Initial editor loading, project persistence and visible `SSE live` saved status.
- Engineering and Manufacturing ribbon navigation.
- Voltage-drop form with the independent 400 V / 32 A / 50 m case: **4.190177 V**, **1.047544%**.
- Negative-current rejection, correcting the value, and saving the calculation and its inputs.
- Cabinet dialog display with 12 component volumes; route-wire dialog opening and endpoint controls.
- Screenshot inspection of calculation/editor layout and cabinet layout.

Browser QA found and fixed the HTTP-preview UUID initialization failure. Visual inspection found and fixed a Canvas cabinet backplate draw-order defect. Subsequent browser actions were rejected by the browser URL policy, so post-fix cabinet screenshots, complete drawing editing, two-tab collaboration and the remaining browser matrix were not performed. Earlier screenshots document the inspected state, not final visual acceptance.

## Release artifact checks

The final generated Worker passed ESM validation plus an in-process smoke check for nine app/module/qualification routes, authenticated project creation and a committed field operation. All seven npm tarballs were extracted separately: the six DOM-free module entry points loaded, the default collaboration export resolved to the live client, the core registered 80 symbols, and the browser controls entrypoint/stylesheet resolved. Syntax and relative imports were checked across 38 JavaScript files.

![Calculator during browser verification](images/calculation-v02.jpg)

The screenshot records the verified calculator flow. It is not evidence of hardware WebGPU execution.

## Explicitly unqualified

Physical WebGPU and driver behavior, full cross-browser/device interactions, actual EPLAN/TIA/Studio 5000/TwinCAT native/vendor round trips, production D1 load, multi-region behavior, long network partitions, manufacturing tolerance/process qualification, and certified electrical calculations remain unqualified. No npm registry publication was performed. The included evidence runner and qualification procedure make these future checks reproducible; they do not replace them.
