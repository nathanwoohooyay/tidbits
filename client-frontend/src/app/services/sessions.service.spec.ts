import { describe, expect, it } from 'vitest';
import { describeDevice } from './sessions.service';

describe('describeDevice', () => {
  it('names common browsers and systems', () => {
    expect(describeDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'))
      .toEqual({ label: 'Chrome on macOS', mobile: false });
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0'))
      .toEqual({ label: 'Edge on Windows', mobile: false });
    expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'))
      .toEqual({ label: 'Safari on iOS', mobile: true });
    expect(describeDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'))
      .toEqual({ label: 'Chrome on Android', mobile: true });
    expect(describeDevice('Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'))
      .toEqual({ label: 'Firefox on Linux', mobile: false });
  });

  it('falls back when the user agent is missing or unrecognised', () => {
    expect(describeDevice(null).label).toBe('Unknown device');
    expect(describeDevice('curl/8.5.0').label).toBe('Unknown device');
  });
});
