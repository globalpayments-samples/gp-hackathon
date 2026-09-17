# {{ PROJECT_TITLE }}

{{ PLATFORM_NAME }} PHP schema-v2 sample generated from catalog manifests.

## Selected components

{{ COMPONENT_TABLE }}

The TAPI scaffold uses `TransactionApiConfig` and credential-gated live routes. Credentials are read only from the environment.

## Configuration

{{ CONFIG_VARS }}

`TAPI_API_VERSION` defaults to `2021-04-08`, and `TAPI_PARTNER_NAME`
defaults to `{{ PROJECT_NAME }}`. Override either value when the assigned
credential package specifies a different API version or registered app name.
