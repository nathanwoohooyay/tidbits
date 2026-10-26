// The caller's IP address, for login limits and audit logs.
//
// Requests normally arrive through one of the frontends' nginx, which sets X-Real-IP to the address it saw. That header
// is only believed when the request really came from a proxy on the private Docker network; anyone else could send
// it themselves. X-Forwarded-For is never used: nginx appends to whatever the client sent, so its first entry is
// client-controlled.
const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

function isPrivateAddress(address) {
  if (!address) {
    return false;
  }
  const v4 = address.startsWith('::ffff:') ? address.slice(7) : address;
  if (PRIVATE_V4.some((pattern) => pattern.test(v4))) {
    return true;
  }
  const lower = address.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd');
}

function clientIp(req) {
  const peer = req.socket?.remoteAddress || req.ip || null;
  const realIp = req.headers?.['x-real-ip'];
  if (isPrivateAddress(peer) && typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return peer;
}

module.exports = {
  clientIp,
  isPrivateAddress,
};
