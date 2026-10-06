const APP_URL = 'https://kulsrestha-wf-donation-receipt.vercel.app';
const fields = ['receiptNo','date','time','donorName','amount','cause','paymentMode'];

export function getReceiptShareUrl(donation) {
  // Only receipt fields are shared. The fragment stays in the recipient's browser;
  // opening a receipt never queries the private donations collection.
  const snapshot = Object.fromEntries(fields.map(key => [key, donation[key] ?? '']));
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
    .replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  return APP_URL + '/receipt?no=' + encodeURIComponent(donation.receiptNo) + '#data=' + encoded;
}

export function readSharedReceipt(location) {
  const encoded = new URLSearchParams(location.hash.slice(1)).get('data');
  if (!encoded || encoded.length > 24000) throw new Error('This receipt link is incomplete. Please request a new link from the foundation.');
  const raw = atob(encoded.replaceAll('-','+').replaceAll('_','/'));
  const parsed = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid receipt link.');
  const receipt = Object.fromEntries(fields.map(key => [key, parsed[key] ?? '']));
  if (fields.some(key => key !== 'amount' && (typeof receipt[key] !== 'string' || receipt[key].length > 4000))) throw new Error('Invalid receipt details.');
  const number = new URLSearchParams(location.search).get('no');
  if (!receipt.receiptNo || (number && number !== receipt.receiptNo) || typeof receipt.amount !== 'number' || !Number.isFinite(receipt.amount) || receipt.amount < 0) throw new Error('Invalid receipt link.');
  return receipt;
}
