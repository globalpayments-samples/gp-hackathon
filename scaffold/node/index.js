/**
 * {{ PROJECT_NAME }} — generated standalone sample project.
 * Composed by the Builder from the Global Payments component catalog.
 * Everything below the imports is signal: configuration, then one route per
 * selected component. The Baseplate hides the server boilerplate in ./core.
 */
'use strict';

const { initialize, finalize } = require('./core/baseplate');
const { loadConfig } = require('./core/config');
{{ IMPORTS }}

{{ TARGET_BEFORE }}

const config = loadConfig();
{{ TARGET_DURING_1 }}

const app = initialize();

{{ ROUTE_HANDLERS }}

{{ WIRING }}

finalize(app);

{{ TARGET_AFTER }}

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Sample project running on http://localhost:${port}`);
  });
}

module.exports = app;
