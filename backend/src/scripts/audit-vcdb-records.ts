import AdmZip from 'adm-zip';
import axios from 'axios';

async function auditVcdb() {
  const url = 'https://raw.githubusercontent.com/vz-risk/VCDB/master/data/joined/vcdb.json.zip';
  console.log('Downloading VCDB zip from:', url);
  const resp = await axios.get(url, { responseType: 'arraybuffer' });
  const zip = new AdmZip(Buffer.from(resp.data));
  const entry = zip.getEntries().find(e => e.entryName.endsWith('.json'));
  if (!entry) throw new Error('No json entry found in zip');
  
  const text = zip.readAsText(entry);
  const rawArray = JSON.parse(text);
  console.log('Total raw records in JSON array:', rawArray.length);

  let missingId = 0;
  let invalidStructure = 0;
  const idCounts = new Map();
  const idCaseCounts = new Map();

  for (const item of rawArray) {
    if (!item || typeof item !== 'object') {
      invalidStructure++;
      continue;
    }
    const id = item.incident_id;
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      missingId++;
      continue;
    }
    
    // Case-sensitive exact
    idCounts.set(id, (idCounts.get(id) || 0) + 1);

    // Case-insensitive
    const upperId = id.toUpperCase();
    idCaseCounts.set(upperId, (idCaseCounts.get(upperId) || 0) + 1);
  }

  const duplicatesExact = [];
  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      duplicatesExact.push({ id, count });
    }
  }

  const duplicatesCaseInsensitive = [];
  for (const [upperId, count] of idCaseCounts.entries()) {
    if (count > 1) {
      duplicatesCaseInsensitive.push({ upperId, count });
    }
  }

  console.log('Missing/Empty incident_id count:', missingId);
  console.log('Invalid non-object structure count:', invalidStructure);
  console.log('Unique case-sensitive incident_ids:', idCounts.size);
  console.log('Unique case-insensitive incident_ids:', idCaseCounts.size);
  console.log('Number of incident_ids appearing > 1 time (exact):', duplicatesExact.length);
  
  let totalDuplicateOccurrencesExact = 0;
  for (const d of duplicatesExact) {
    totalDuplicateOccurrencesExact += (d.count - 1);
  }
  console.log('Total excess duplicate records (exact):', totalDuplicateOccurrencesExact);
  console.log('Duplicate IDs list (exact):', JSON.stringify(duplicatesExact, null, 2));

  let totalDuplicateOccurrencesCase = 0;
  for (const d of duplicatesCaseInsensitive) {
    totalDuplicateOccurrencesCase += (d.count - 1);
  }
  console.log('Total excess duplicate records (case-insensitive):', totalDuplicateOccurrencesCase);
}

auditVcdb().catch(err => {
  console.error(err);
  process.exit(1);
});
