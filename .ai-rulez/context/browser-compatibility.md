# Browser Compatibility

Core factory functionality must work in both Node.js and browser environments.

Fixture generation with `buildFixture()` and `buildFixtureAsync()` is Node-only because it depends on Node.js file system and crypto modules. In browser environments, fixture methods must throw a `FixtureError` explaining that fixture functionality is unavailable.
