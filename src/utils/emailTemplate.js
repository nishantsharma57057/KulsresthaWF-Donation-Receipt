import { receiptLogo } from '../assets/receiptLogo';
import { trusteeSignature } from '../assets/trusteeSignature';
import { resolveNgoProfile } from '../config/appConfig';
import { numberToIndianWords } from './numberToWords';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value = v => String(v ?? '').trim() || '—';
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v+'T12:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : value(v);
const inlineImage = data => ({ mimeType:'image/png', data:data.split(',')[1] });

export function buildDonationEmail(donation, inputSettings = {}, customMessage) {
  const settings = resolveNgoProfile(inputSettings);
  const amount = Number(donation.amount);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid donation amount.');
  const formatted = amount.toLocaleString('en-IN',{maximumFractionDigits:2});
  const words = numberToIndianWords(amount);
  const message = customMessage ?? ('Dear '+value(donation.donorName)+',\n\nThank you for your generous donation towards '+value(donation.cause)+'. Your support helps us extend care, opportunity and dignity to more people.\n\nPlease find your donation receipt attached and retain it for your records.');
  const office = [settings.address,settings.city,settings.state,settings.pincode].filter(Boolean).join(', ');
  const subject = 'Donation receipt ['+value(donation.receiptNo)+'] — '+settings.orgName;
  const fields = [['Receipt number',donation.receiptNo],['Donation date',[date(donation.date),donation.time].filter(Boolean).join(', ')],['Purpose',donation.cause],['Payment method',donation.paymentMode],['Transaction reference',donation.transactionId],...(donation.donorPan?[['Donor PAN',donation.donorPan]]:[])];
  const text = message+'\n\nDONATION RECEIPT\nAmount: ₹'+formatted+'\n'+words+'\n'+fields.map(([l,v])=>l+': '+value(v)).join('\n')+'\n\n'+settings.orgName+'\n'+office+'\nMobile: '+settings.phone+'\n'+settings.email+'\n'+settings.website+'\nPAN: '+settings.pan+'\nRegistration No.: '+settings.cin+'\n\n'+settings.signatoryName+'\n'+settings.signatoryTitle+' · Authorized Signatory';
  const e=escapeHtml;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f2f7fa;color:#1e3246;font-family:Poppins,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Thank you for your contribution. Receipt ${e(donation.receiptNo)} · ₹${e(formatted)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f7fa;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #cfe6f0;border-radius:16px;overflow:hidden;">
<tr><td style="background:#eef9fc;padding:28px 28px 24px;border-top:5px solid #3db7d3;">
<img src="cid:receiptLogo" width="300" alt="${e(settings.orgName)}" style="display:block;width:100%;max-width:300px;height:auto;">
<p style="margin:18px 0 0;font-size:10px;letter-spacing:1px;font-weight:600;color:#1385a6;">CARE · DIGNITY · OPPORTUNITY · IMPACT</p>
<h1 style="margin:24px 0 8px;font-family:Montserrat,Arial,sans-serif;font-size:26px;line-height:1.3;color:#143c52;">DONATION <span style="color:#1385a6;">RECEIPT</span></h1>
<p style="margin:0;font-size:13px;color:#6b7f90;">Thank you for your generous support.</p></td></tr>
<tr><td style="padding:24px 28px;">
<div style="border:1px solid #cfe6f0;border-left:4px solid #3db7d3;border-radius:12px;background:#f6fbfe;padding:20px;">
<p style="margin:0 0 6px;font-size:10px;font-weight:600;color:#6b7f90;letter-spacing:.6px;">RECEIVED FROM</p>
<p style="margin:0 0 18px;font-size:18px;font-weight:600;color:#143c52;overflow-wrap:anywhere;">${e(value(donation.donorName))}</p>
<div style="padding:16px;background:#fff;border:1px solid #cfe6f0;border-radius:10px;">
<p style="margin:0;font-size:10px;font-weight:600;color:#6b7f90;">DONATION AMOUNT</p>
<p style="margin:6px 0;font-size:30px;line-height:1.25;font-weight:600;color:#1385a6;">₹ ${e(formatted)}</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#6b7f90;">${e(words)}</p></div></div>
<p style="font-size:13px;line-height:1.8;color:#52657b;white-space:normal;">${e(message).replace(/\n/g,'<br>')}</p>
<h2 style="margin:24px 0 12px;font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#143c52;">DONATION DETAILS</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fields.map(([l,v])=>`<tr><td width="40%" valign="top" style="padding:10px 8px 10px 0;border-bottom:1px solid #edf3f7;font-size:12px;color:#6b7f90;">${e(l)}</td><td valign="top" style="padding:10px 0;border-bottom:1px solid #edf3f7;font-size:12px;font-weight:600;overflow-wrap:anywhere;">${e(value(v))}</td></tr>`).join('')}</table>
<div style="margin:24px 0;padding:16px;border-radius:10px;background:#eef9fc;"><p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#1385a6;">YOUR SUPPORT CREATES REAL CHANGE</p><p style="margin:0;font-size:12px;line-height:1.7;">Every contribution brings a brighter tomorrow closer.</p></div>
<h2 style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#143c52;">FOUNDATION DETAILS</h2>
<p style="font-size:12px;line-height:1.8;color:#52657b;">${e(settings.orgName)}<br>${e(office)}<br>Mobile: ${e(settings.phone)}<br><a href="mailto:${e(settings.email)}" style="color:#1385a6;">${e(settings.email)}</a><br><a href="https://${e(String(settings.website).replace(/^https?:\/\//,''))}" style="color:#1385a6;">${e(settings.website)}</a><br>PAN: ${e(settings.pan)}<br>Registration No.: ${e(settings.cin)}</p>
<img src="cid:trusteeSignature" width="150" alt="Authorized signatory signature" style="display:block;width:150px;height:auto;margin-top:24px;">
<p style="margin:8px 0 4px;font-size:13px;font-weight:600;">${e(settings.signatoryName)}</p><p style="margin:0;font-size:11px;color:#6b7f90;">${e(settings.signatoryTitle)} · Authorized Signatory</p>
</td></tr><tr><td style="padding:20px 28px;background:#1385a6;color:#fff;"><p style="margin:0;font-size:10px;line-height:1.8;letter-spacing:.3px;">PEOPLE · CARE · OPPORTUNITIES · BRIGHTER TOMORROWS</p><p style="margin:8px 0 0;font-size:10px;">${e(donation.receiptNo)} · Computer generated acknowledgement</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, message, text, html, previewHtml:html.replaceAll('cid:receiptLogo',receiptLogo).replaceAll('cid:trusteeSignature',trusteeSignature),
    inlineImages:{receiptLogo:inlineImage(receiptLogo),trusteeSignature:inlineImage(trusteeSignature)} };
}
