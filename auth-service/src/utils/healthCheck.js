// One dependency check for the health endpoint. It gives up after a couple of seconds, so a hung database or broker
// reports as down instead of stalling the endpoint.
const CHECK_TIMEOUT_MS = 2000;

async function timedCheck(run, failureReason, timeoutMs = CHECK_TIMEOUT_MS) {
  const started = Date.now();
  let timer;
  try {
    await Promise.race([
      run(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timed out')), timeoutMs);
      }),
    ]);
    return { status: 'up', latencyMs: Date.now() - started };
  } catch {
    return { status: 'down', reason: failureReason };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  timedCheck,
};
