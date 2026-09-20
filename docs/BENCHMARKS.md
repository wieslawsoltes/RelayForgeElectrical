# Local CPU benchmark

Node v24.19.0 on Linux. Synthetic project: 2,000 relay placements and 2,000 short wires, one warmup and five measured runs. Data intentionally extends beyond the visible sheet to exercise model processing.

| Operation | Median ms | Min ms | Max ms |
|---|---:|---:|---:|
| Build electrical graph | 105.95 | 64.43 | 242.78 |
| Generate scene primitives | 59.01 | 21.59 | 68.22 |
| Validate electrical project | 51.44 | 34.53 | 105.47 |

These are local CPU measurements, not browser frame rates, physical-GPU timings, a guarantee for other hardware, or a production-scale benchmark. Electrical checks build a graph; renderer scene preparation does not execute WebGPU.
