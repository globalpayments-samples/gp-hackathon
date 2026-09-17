# Baseplate gp api node

GP API schema-v2 sample generated from catalog manifests, not string-emitted application code.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| Baseplate only | baseplate | Platform scaffold without optional components. |

## Routes

Only fixed, component-declared routes are registered. There is no generic operation proxy.

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

Live routes are credential gated and return HTTP 503 until all required values are present.
