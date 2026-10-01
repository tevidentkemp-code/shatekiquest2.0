# shatekiquest2.0

Repository initialised. The temporary `steve-bingo-beta` branch is isolated and is not merged into `main`.

This branch contains the functional StevO BingO beta client and its compatible Edge Function sources. It is separate from the local React design preview and the staged backend hardening project.

Run `node scripts/package-edge.mjs` to generate both `page.ts` files from the reviewed `index.html` before deploying. The legacy functions keep their existing custom token authentication and `verify_jwt=false` configuration. The retry fix returns the saved result of a matching event, including removal and the final winning tap; scores, boards and achievements still come from event replay on the server.

`steve-bingo-publish` writes `index-v1.html` to the existing public Storage bucket on **every HTTP request**. Invoke it once deliberately after deployment and readback. The playable browser client is hosted from this isolated Git branch; the Storage object is the archived HTML.
