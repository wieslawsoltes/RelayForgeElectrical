# Licensed EPLAN companion

The companion provides a local integration boundary to the user's EPLAN installation. It does not reverse engineer native binary files and does not translate an arbitrary native project into the RelayForge model.

Requirements: Windows, Node 24+, an installed and licensed EPLAN Electric P8 version supporting the requested action, and permission to access the selected source/output paths. Keep backups before native import/restore operations. Test against copies of representative projects first.

```powershell
$env:EPLAN_EXE = 'C:\Program Files\EPLAN\Platform\VERSION\Bin\EPLAN.exe'
node bridge/eplan-bridge.mjs bridge/example-job.json --dry-run
node bridge/eplan-bridge.mjs bridge/example-job.json
```

The app's Automation → Native EPLAN bridge tool generates reviewable job JSON. The executable is never launched by a webpage. Macro generation additionally requires `macroProjectConfirmed:true`; the source must be a valid EPLAN macro project. Export path conventions can vary by action and installed release; inspect dry-run arguments and resulting files.

Supported operations:

| Job operation | EPLAN action | Purpose |
|---|---|---|
| `exportProject` / `importProject` | `export` / `import`, `PXFPROJECT` | Native project exchange through EPLAN |
| `backupProject` / `restoreProject` | `backup` / `restore`, `PROJECT` | Native backup/restore |
| `generateMacros` | `generatemacros` | Window/page macro output from macro project |
| `exportPLC` / `importPLC` | `plcservice` | Configured EPLAN PLC converter |

Only documented operation/parameter keys are accepted. Arguments are passed directly to `spawn` with `shell:false`; control characters are rejected. Execution has a timeout, bounded captured output, exit-code checks and expected-file checks where applicable. Successful process exit alone does not certify project fidelity. No native execution was available during development.

Primary references: [EPLAN export action](https://www.eplan.help/en-us/Infoportal/Content/api/2025/export.html), [import](https://www.eplan.help/en-us/Infoportal/Content/api/2025/import.html), [backup](https://www.eplan.help/en-us/Infoportal/Content/api/2025/backup.html), [restore](https://www.eplan.help/en-us/Infoportal/Content/api/2025/restore.html), [macro generation](https://www.eplan.help/en-us/Infoportal/Content/api/2025/generatemacros.html), [PLC service](https://www.eplan.help/en-us/Infoportal/Content/api/2025/plcservice.html).
