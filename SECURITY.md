# Security

Genesis Engine is a closed-source client laboratory. Hardening means: no secrets in the tree, no evaluation of user files, and data that does not leave the device unless you explicitly opt in.

- No accounts in the default build.
- No telemetry.
- Journal, music, and MCMC stay in `localStorage` / IndexedDB on that profile.
- User audio is decoded by the browser. Never `eval`’d.
- Catalog / FITS / VOTable are parsed as data with size and schema checks.
- Chronicle text is rendered as text, not HTML.
- Electron keeps `nodeIntegration` off and `contextIsolation` on.

Report vulnerabilities privately to the copyright holder. Do not file a public issue.
