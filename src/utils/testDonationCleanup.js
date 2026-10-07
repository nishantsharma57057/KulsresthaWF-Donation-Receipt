// User-approved test ledger cleanup. SHA-256 fingerprints avoid embedding donor details.
const approvedTestFingerprints = new Set([
  "a63c4dc84007d1c60fb75250b244837207b543033614df99a0a60bdddf2e1c0b",
  "685395efbb01594f27f01c2ba91bc3c7f11857e1fb5ed587cd1a77d39c1bf5c7",
  "49f90533f02f4f144898290e08b59bffb49bb0c0db9b29e91906bbe40e4a1813",
  "b5b23ae47e58da916c57dbacce3e6d1ae15ad2b8234d0d5dc1e07b8bc543fe6d",
  "e3d3578e5825c81aec7516c359d8ce2445b0cff2a6924c350d054c2b7137396b",
  "eaa93f4bfc3b040639b9c7d2d0711a2f76813b3277a4f3ddf0036df3f032aa40",
  "32fa5f586b490acac742cff83013bef0aef6ef05c38674510a98e94f181e6320",
  "78431fe229654f4ab51a1954aca9edfa9dd13f1a59a537e46b9860447727a0c9",
  "52ece24b617699a55bfb96a36de6be12c03410ac9af6da7d42bfb256d5c7f66a",
  "73930781d29034965368b5a1d8edd70885ab486f88174106685b3b363e30c33f",
  "d7bd9ead0f4b75dfbc432ca146ea5f434d16b71040bfca0ea420b32a566fd9fa",
  "65b7c5b2c5abf5dac604874ecbcbe963dfd58026bee0946faa8e621451b1a0ed",
  "0eaf17e932c28a873679f7e104129615d5fc68d4952b950154a139b279168556",
  "c52b2d7f79257b3c0d45ebb1a9b314e13a82e1851644fafbbf5656c3bd0f18f9",
  "dea9a19e2de615d9aa4febdc825d5afebc4ba4371fea81b39b2775650d69135d",
  "5c5940c982a1c44a3a801cbb915458de1bd949acece31c44aaeb86df2fd6fa59",
  "8782ed96555c71297e8ce8e87c7f0a61bc89ad40f0a94d044135a2f1f45e6937",
  "a0749077359135a571ce7833ac2d090e9a0cd8f9cab457f8a4240c150c5300c1",
  "c9627769128024540c7a40e91a28e5bb4601fa47eaa4c480d901dc6f897780fd",
  "6cb7ba12619b436a770c1ac3424ec5d14b597bd2b653fcb9faecb6d3970522d2",
  "2677f2814d158b01921eef004e19329d5546bd1277eb0c29534c04215f824e07",
  "833f0d6b64d8af89c539eb1def0dc5a9e946818841b23e937db2d5dec4ebc4a3",
  "e840a068bbb8f488585360f888d5d1a2cb929093e063faf294563552488212db",
  "92315d8c15d756aac5e2323f6dfd9979edf43b04ea42fcfe5a50556f0deb7ad8",
  "d32838afb1b5dc3a0b4f167199243a4f9d51f82361e7a138ab58097de22b44fa",
  "4345284fae5c73cd8b9180d30a9950701d2f11ccb1235bcf81c3a91256625456",
  "e44bcb7d86b631c291e87cccb63578ac439d531920d6907afa1cc0043bb1ed08",
  "be151a81c4db69d7f0641f5a8ef297017b51402904d769dd3ce313da59a874af",
  "258d9e750fc5a6f391dfab1edc34247f18e59641667f81df0f4c5ebc65f30089",
  "9e7a64c69628c3ddf104713cf91c673447f7291747968aed1412a1687fd718d7",
  "be22bd872b108efef472aa684b60812e8b1c92de7dc9edb4f8632d56ff106822",
  "008ebf440b6cab270c83db90494c22a86f6efb15e9e9c7b7702bdb95c8e5f59f"
]);
const DONATIONS_KEY = 'kwf_donations_records_v1';
const BACKUP_KEY = 'kwf_test_donations_backup_20261008';
const readRecords = key => {
  const raw = localStorage.getItem(key);
  const records = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(records)) throw new Error('Donation cache is invalid. Cleanup was not performed.');
  return records;
};

export async function isApprovedTestDonation(record) {
  if (!record || !/^KWF-202627-01(?:0[6-9]|[12][0-9]|3[0-7])$/.test(String(record.receiptNo))) return false;
  const canonical = JSON.stringify([
    String(record.receiptNo || '').trim(), String(record.date || '').trim(),
    String(record.time || '').trim(), String(record.donorName || '').trim(),
    String(Number(record.amount)), String(record.transactionId || '').trim()
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return approvedTestFingerprints.has(fingerprint);
}

let cleanupInProgress;
export function cleanupApprovedLocalTestDonations() {
  if (cleanupInProgress) return cleanupInProgress;
  cleanupInProgress = (async () => {
    const records = readRecords(DONATIONS_KEY);
    const matching = await Promise.all(records.map(isApprovedTestDonation));
    const tests = records.filter((_, index) => matching[index]);
    if (!tests.length) return { removedCount: 0 };
    // Retain a local recovery copy before changing the active ledger.
    const backup = readRecords(BACKUP_KEY);
    const combined = [...backup];
    for (const record of tests) {
      if (!combined.some(old => JSON.stringify(old) === JSON.stringify(record))) combined.push(record);
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(combined));
    // Re-read so records added by another tab during hashing are preserved.
    const latest = readRecords(DONATIONS_KEY);
    const exactTests = new Set(tests.map(record => JSON.stringify(record)));
    const retained = latest.filter(record => !exactTests.has(JSON.stringify(record)));
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(retained));
    return { removedCount: latest.length - retained.length };
  })().finally(() => { cleanupInProgress = null; });
  return cleanupInProgress;
}
