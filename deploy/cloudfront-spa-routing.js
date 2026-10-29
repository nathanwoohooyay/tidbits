// CloudFront Function (runtime cloudfront-js-2.0), attached as a viewer-request function to the default (S3)
// behaviour of both distributions. The apps' own pages (/dashboard, /admin/users) aren't files in the bucket, so
// they're served index.html and Angular's router shows the page. Paths with a file extension pass through untouched,
// so a missing image still fails and the page shows its placeholder. API paths never reach this function: they have
// their own behaviours that go to EC2.
function handler(event) {
  var request = event.request;
  var lastSegment = request.uri.split('/').pop();
  if (lastSegment.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
