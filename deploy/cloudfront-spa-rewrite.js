// CloudFront Function (runtime cloudfront-js-2.0), attached to the default (S3) behavior of each distribution as a
// viewer request. Angular routes like /portfolio have no file in S3, so they get the app shell; real files
// (/main-abc.js, /prizes/x.png) pass through, and a missing prize image still errors so the page shows its placeholder.
function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
