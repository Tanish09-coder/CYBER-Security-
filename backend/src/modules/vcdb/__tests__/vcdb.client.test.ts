import { VcdbClient } from '../vcdb.client';
import { VcdbInvalidPayloadError } from '../vcdb.validation';
import AdmZip from 'adm-zip';

describe('VcdbClient', () => {
  let client: VcdbClient;

  beforeEach(() => {
    client = new VcdbClient({
      timeoutMs: 5000,
      maxRetries: 1,
    });
  });

  it('should parse valid ZIP archive containing vcdb JSON file', () => {
    const mockIncidents = [
      {
        incident_id: '12345-abcde',
        summary: 'Test breach incident',
        actor: { external: { variety: ['External'] } },
      },
    ];

    const zip = new AdmZip();
    zip.addFile('vcdb_1-of-1.json', Buffer.from(JSON.stringify(mockIncidents), 'utf-8'));
    const zipBuffer = zip.toBuffer();

    const result = client.parseZipBuffer(zipBuffer);
    expect(result.incidents).toHaveLength(1);
    expect(result.incidents[0].incident_id).toBe('12345-abcde');
    expect(result.uncompressedSizeBytes).toBeGreaterThan(0);
  });

  it('should reject zip with unsafe path traversal filename', () => {
    const zip = new AdmZip();
    zip.addFile('test.json', Buffer.from('[]', 'utf-8'));
    const zipBuffer = zip.toBuffer();
    const badZip = new AdmZip(zipBuffer);
    badZip.getEntries()[0].entryName = '../etc/passwd.json';
    const badBuffer = badZip.toBuffer();

    expect(() => client.parseZipBuffer(badBuffer)).toThrow(VcdbInvalidPayloadError);
  });

  it('should reject non-ZIP or malformed buffer', () => {
    const malformedBuffer = Buffer.from('NOT A ZIP FILE HEADER');
    expect(() => client.parseZipBuffer(malformedBuffer)).toThrow(VcdbInvalidPayloadError);
  });

  it('should enforce decompression size limits', () => {
    const clientStrict = new VcdbClient({
      maxDecompressedBytes: 10, // Exceedingly small threshold for test
    });

    const zip = new AdmZip();
    zip.addFile('vcdb.json', Buffer.from(JSON.stringify({ longData: 'x'.repeat(50) }), 'utf-8'));
    const zipBuffer = zip.toBuffer();

    expect(() => clientStrict.parseZipBuffer(zipBuffer)).toThrow(VcdbInvalidPayloadError);
  });
});
