const APP_URL = 'https://kulsrestha-wf-donation-receipt.vercel.app';
const fields = ['receiptNo','date','time','donorName','donorPhone','donorEmail','donorPan','donorAddress','donorCity','donorState','donorPincode','amount','cause','paymentMode','transactionId'];

export function getReceiptShareUrl(donation) {
  // Include the full donor receipt for its recipient. The fragment stays in the browser;
  // opening it does not query the private donations collection.
  const snapshot = Object.fromEntries(fields.map(key => [key, donation[key] ?? '']));
  snapshot.version = 2;
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
  return { ...receipt, sharedReceiptIncomplete: parsed.version !== 2 };
}
