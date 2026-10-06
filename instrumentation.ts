/**
 * Next.js instrumentation hook — runs once when the server instance starts,
 * before any application code is loaded.
 *
 * Node 25 removed the long-deprecated `buffer.SlowBuffer` export, which crashes
 * `buffer-equal-constant-time@1.0.1` (it reads `SlowBuffer.prototype` at module
 * load). That package is pulled in transitively by firebase-admin:
 *   firebase-admin -> google-auth-library / jsonwebtoken -> jws -> jwa
 *     -> buffer-equal-constant-time
 * There is no fixed upstream version, so we restore the alias before anything
 * requires it. Safe on older Node versions (the polyfill only applies when the
 * export is missing).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const buffer = require("buffer");
    if (!buffer.SlowBuffer) {
      buffer.SlowBuffer = buffer.Buffer;
      console.log(
        "[instrumentation] Restored removed `buffer.SlowBuffer` alias (Node " +
          process.version +
          ") for firebase-admin JWT dependencies."
      );
    }
  }
}
