---
kind: convention
status: accepted
---

# Convention: controller

- `<Action><Resource>Controller`, in `api/controllers/<resource>/`: `RetryTextResourceController`.
- It holds one use case. Its method `run(request, response)` parses the input with Zod and gives primitives to the use case.
