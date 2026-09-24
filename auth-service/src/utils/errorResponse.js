function sendError(res, req, status, errorCode, message) {
  return res.status(status).json({
    errorCode,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    status,
  });
}

module.exports = {
  sendError,
};

