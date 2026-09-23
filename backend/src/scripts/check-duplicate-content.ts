import AdmZip from 'adm-zip';
import axios from 'axios';
import crypto from 'crypto';

async function checkDuplicatesContent() {
  const url = 'https://raw.githubusercontent.com/vz-risk/VCDB/master/data/joined/vcdb.json.zip';
  const resp = await axios.get(url, { responseType: 'arraybuffer' });
  const zip = new AdmZip(Buffer.from(resp.data));
  const entry = zip.getEntries().find(e => e.entryName.endsWith('.json'))!;
  const text = zip.readAsText(entry);
  const rawArray: any[] = JSON.parse(text);

  const byId = new Map<string, any[]>();
  for (const item of rawArray) {
    if (!item?.incident_id) continue;
    if (!byId.has(item.incident_id)) byId.set(item.incident_id, []);
    byId.get(item.incident_id)!.push(item);
  }

  let identicalDuplicates = 0;
  let differingDuplicates = 0;

  for (const [id, items] of byId.entries()) {
    if (items.length > 1) {
      const hashes = items.map((it: any) => crypto.createHash('sha256').update(JSON.stringify(it)).digest('hex'));
      const allIdentical = hashes.every((h: string) => h === hashes[0]);
      if (allIdentical) {
        identicalDuplicates++;
      } else {
        differingDuplicates++;
      }
    }
  }

  console.log('Duplicate IDs with identical JSON payload:', identicalDuplicates);
  console.log('Duplicate IDs with differing revisions/fields:', differingDuplicates);
}

checkDuplicatesContent().catch(console.error);
