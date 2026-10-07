import { jsPDF } from 'jspdf';
import { numberToIndianWords } from './numberToWords';
import { PoppinsRegular, PoppinsSemiBold, MontserratBold } from '../assets/receiptFonts';
import { receiptLogo } from '../assets/receiptLogo';
import { trusteeSignature } from '../assets/trusteeSignature';
import { resolveNgoProfile } from '../config/appConfig';

const C = {
  navy: [20, 60, 82], teal: [19, 133, 166], cyan: [61, 183, 211],
  muted: [107, 127, 144], ink: [30, 50, 70], line: [207, 230, 240],
  pale: [238, 249, 252], white: [255, 255, 255]
};
const value = v => String(v ?? '').trim() || '—';
const address = (...parts) => parts.map(v => String(v ?? '').trim()).filter(Boolean).join(', ') || '—';
function dateLabel(v) {
  const match = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(+match[1], +match[2]-1, +match[3]).toLocaleDateString('en-IN', {
    day:'2-digit',month:'short',year:'numeric'
  }) : value(v);
}

/** Reference layout; this PDF is also used directly for the modal preview. */
export function generateDonationPdf(donation, settings = {}) {
  return renderDonationPdf(donation, settings);
}

function renderDonationPdf(donation, settings, bodyScale = 1) {
  if (!donation) throw new Error('Donation details are required.');
  settings = resolveNgoProfile(settings);
  const amount = Number(donation.amount);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
    throw new Error('Donation amount is invalid.');
  }
  const doc = new jsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
  for (const [file, font, weight, data] of [
    ['Poppins-Regular.ttf','Poppins','normal',PoppinsRegular],
    ['Poppins-SemiBold.ttf','Poppins','bold',PoppinsSemiBold],
    ['Montserrat-Bold.ttf','Montserrat','bold',MontserratBold]
  ]) { doc.addFileToVFS(file,data); doc.addFont(file,font,weight); }
  doc.setProperties({title:'Donation receipt - '+value(donation.receiptNo),author:settings.orgName});
  doc.setLineHeightFactor(1.35);
  const left=12,right=198,width=186;
  let y=0;
  function style(size=8,bold=false,color=C.ink,heading=false) {
    doc.setFont(heading?'Montserrat':'Poppins',heading||bold?'bold':'normal');
    doc.setFontSize(size);doc.setTextColor(...color);
  }
  function lines(v,w,size=8,bold=false) {
    style(size,bold);return doc.splitTextToSize(value(v),w);
  }
  function text(v,x,top,w,size=8,bold=false,color=C.ink) {
    const rows=lines(v,w,size,bold);style(size,bold,color);doc.text(rows,x,top);
    return rows.length*size*0.3528*1.35;
  }
  function title(v,x,top) {style(9.5,true,C.navy,true);doc.text(v,x,top);}
  function heart(x,top,size=6) {
    doc.setFillColor(...C.cyan);doc.circle(x+size*.3,top+size*.3,size*.3,'F');
    doc.circle(x+size*.7,top+size*.3,size*.3,'F');
    doc.triangle(x,top+size*.35,x+size,top+size*.35,x+size*.5,top+size,'F');
  }
  function header(continued=false) {
    doc.setFillColor(...C.pale);doc.rect(0,0,210,54,'F');
    doc.setFillColor(216,244,249);
    doc.path([{op:'m',c:[132,0]},{op:'c',c:[155,17,180,9,210,22]},{op:'l',c:[210,0]},{op:'h',c:[]}]).fill();
    doc.setFillColor(188,231,242);
    doc.path([{op:'m',c:[156,0]},{op:'c',c:[170,9,192,9,210,15]},{op:'l',c:[210,0]},{op:'h',c:[]}]).fill();
    doc.addImage(receiptLogo,'PNG',left,9,86,16.45);
    style(8.3,true,C.teal);doc.text('CARE  •  DIGNITY  •  OPPORTUNITY  •  IMPACT',left,33);
    style(8.5,true,C.navy);doc.text('ONLINE DONATION RECEIPT',134,12);
    style(8.2,false,C.muted);doc.text('Receipt No.',134,20);doc.text('Issue Date',134,26);
    text(donation.receiptNo,164,20,34,8.5,true);
    text(dateLabel(donation.date),164,26,34,8.5,true);
    style(22,true,C.navy,true);doc.text(continued?'RECEIPT CONTINUED':'DONATION',left,51);
    if(!continued) {
      const wordWidth=doc.getTextWidth('DONATION ');
      style(22,true,C.teal,true);doc.text('RECEIPT',left+wordWidth,51);
    }
    style(9,true,C.muted);doc.text('Thank you for your generous support.',left,59);
    doc.setFillColor(227,247,240);doc.roundedRect(167,47,31,8,4,4,'F');
    doc.setFillColor(14,145,106);doc.circle(171,51,1,'F');
    style(8,true,[14,145,106]);doc.text('RECORDED',174,52);
    y=66;
  }
  header();
  // Draw the body as one group so lengthy records can fit the same A4 page.
  const bodyTop = y;
  doc.saveGraphicsState();
  const ptPerMm = doc.internal.scaleFactor;
  doc.setCurrentTransformationMatrix(new doc.Matrix(bodyScale,0,0,bodyScale,
    105 * (1 - bodyScale) * ptPerMm,
    (297 - bodyTop) * (1 - bodyScale) * ptPerMm));
  const amountX=104,amountWidth=89,amountTextWidth=amountWidth-10;
  const donorTextWidth=amountX-(left+8)-8;
  const nameRows=lines(donation.donorName,donorTextWidth,15,true);
  const mailRows=lines(donation.donorEmail,donorTextWidth,9.5);
  const words=numberToIndianWords(amount);
  const wordRows=lines(words,amountTextWidth,8.5);
  const summaryHeight=Math.max(39,20+nameRows.length*7+mailRows.length*4.5,27+wordRows.length*4.1);
  doc.setFillColor(246,251,254);doc.setDrawColor(...C.line);
  doc.roundedRect(left,y,width,summaryHeight,4,4,'FD');
  doc.setFillColor(...C.cyan);doc.roundedRect(left,y,2.3,summaryHeight,1,1,'F');
  style(8.5,true,C.muted);doc.text('RECEIVED FROM',left+8,y+10);
  style(15,true,C.navy);doc.text(nameRows,left+8,y+18);
  let contactY=y+18+nameRows.length*7;
  style(9.5,false,C.muted);doc.text(mailRows,left+8,contactY);
  doc.text(value(donation.donorPhone),left+8,contactY+mailRows.length*4.5+1);
  const ax=amountX;
  doc.setFillColor(...C.white);doc.roundedRect(ax,y+4,amountWidth,summaryHeight-8,4,4,'FD');
  style(8.5,true,C.muted);doc.text('DONATION AMOUNT',ax+5,y+13);
  const formatted=amount.toLocaleString('en-IN',{maximumFractionDigits:2});
  let fontSize=24;
  style(fontSize,true,C.teal);
  while(doc.getTextWidth('₹ '+formatted)>amountTextWidth&&fontSize>10){fontSize--;style(fontSize,true,C.teal);}
  doc.text('₹ '+formatted,ax+5,y+23);
  style(8.5,false,C.muted);doc.text(wordRows,ax+5,y+29);
  y+=summaryHeight+6;

  title('DONOR DETAILS',left,y);title('PAYMENT DETAILS',108,y);
  doc.setDrawColor(...C.line);doc.line(left,y+2,102,y+2);doc.line(108,y+2,right,y+2);
  doc.setDrawColor(...C.cyan);doc.setLineWidth(.6);doc.line(left,y+2,left+12,y+2);doc.line(108,y+2,120,y+2);
  doc.setLineWidth(.2);y+=8;
  const pairs=[
    [['Name',donation.donorName],['Transaction ID',donation.transactionId]],
    [['Mobile',donation.donorPhone],['Method',donation.paymentMode]],
    [['Email',donation.donorEmail],['Date / Time',[dateLabel(donation.date),donation.time].filter(Boolean).join(', ')]]
  ];
  for(const [a,b] of pairs) {
    const aa=lines(a[1],60,10,true),bb=lines(b[1],57,10,true);
    for(let offset=0;offset<Math.max(aa.length,bb.length);offset+=25) {
      const la=aa.slice(offset,offset+25),lb=bb.slice(offset,offset+25);
      const height=Math.max(8,Math.max(la.length,lb.length)*4.8+1.5);
      style(8.5,true,C.muted);
      doc.text(a[0],left,y);doc.text(b[0],108,y);
      style(10,true);if(la.length)doc.text(la,left+30,y);if(lb.length)doc.text(lb,141,y);
      y+=height;
    }
  }
  const addr=lines(address(donation.donorAddress,donation.donorCity,donation.donorState,donation.donorPincode),60,9.5);
  const cause=lines(donation.cause,57,10,true);
  for(let offset=0;offset<Math.max(addr.length,cause.length);offset+=25) {
    const aa=addr.slice(offset,offset+25),bb=cause.slice(offset,offset+25);
    const height=Math.max(8,aa.length*4.6+1.5,bb.length*4.8+1.5);
    style(8.5,true,C.muted);doc.text('Address',left,y);doc.text('Purpose',108,y);
    style(9.5,false);if(aa.length)doc.text(aa,left+30,y);
    style(10,true);if(bb.length)doc.text(bb,141,y);y+=height;
  }
  style(8.5,true,C.muted);doc.text('Donor PAN',left,y);
  y+=text(String(donation.donorPan || '').trim().toUpperCase(),left+30,y,60,9.5,true)+3;
  y+=2;
  doc.setFillColor(...C.pale);doc.roundedRect(left,y,width,17,4,4,'F');
  style(9,true,C.teal);doc.text('YOUR SUPPORT CREATES REAL CHANGE',left+6,y+7);
  style(8.5,false);doc.text('Every contribution helps us extend care, opportunity and dignity to more people.',left+6,y+13);
  heart(right-15,y+5);y+=21;

  const orgRows=[['NGO PAN',settings.pan],['Registration No.',settings.cin],
    ...(settings.reg80GNumber?[['80G Reg. No.',settings.reg80GNumber]]:[]),
    ...(settings.reg12ANumber?[['12A Reg. No.',settings.reg12ANumber]]:[])];
  const officeRows=[
    ...lines(settings.orgName,83,9.5),
    ...lines(address(settings.address,settings.city,settings.state,settings.pincode),83,9.5),
    ...lines('Mobile: '+value(settings.phone),83,9.5),
    ...lines(settings.email,83,9.5),
    ...lines(settings.website,83,9.5)
  ];
  const taxHeight=15+orgRows.reduce((h,r)=>h+Math.max(7,lines(r[1],60,9,true).length*4.3+2),0);
  const officeHeight=13+officeRows.length*4.5+2;
  const boxHeight=Math.max(33,taxHeight,officeHeight);
  doc.setDrawColor(...C.line);doc.roundedRect(left,y,width,boxHeight,4,4,'S');
  doc.line(107,y+5,107,y+boxHeight-5);
  title('FOUNDATION DETAILS',left+5,y+8);title('REGISTERED OFFICE',113,y+8);
  let rowY=y+16;
  for(const [label,v] of orgRows) {
    style(8,true,C.muted);doc.text(label,left+5,rowY);
    rowY+=Math.max(7,text(v,left+32,rowY,60,9,true)+2);
  }
  style(9.5,false);doc.text(officeRows,113,y+16);y+=boxHeight+5;
  
  style(8,true,C.teal);doc.text('COMPUTER GENERATED RECEIPT',left,y);
  text('This receipt is generated electronically from the donation record. Please retain it for your records.',left,y+6,110,8.5,false,C.muted);
  style(9,true,C.navy);doc.text('Thank you for helping us build a brighter tomorrow.',left,y+19);
  doc.addImage(trusteeSignature,'PNG',143,y-1,53,18);
  doc.setDrawColor(...C.muted);doc.line(143,y+17,right,y+17);
  style(9,true);doc.text(value(settings.signatoryName),143,y+22);
  style(8,false,C.muted);doc.text(value(settings.signatoryTitle)+' · Authorized Signatory',143,y+27);

  const bodyBottom = y + 30;
  doc.restoreGraphicsState();
  if (bodyScale === 1 && bodyBottom > 269) {
    return renderDonationPdf(donation, settings, (269 - bodyTop) / (bodyBottom - bodyTop));
  }

  const pages=doc.getNumberOfPages();
  for(let p=1;p<=pages;p++) {
    doc.setPage(p);doc.setFillColor(...C.teal);
    doc.path([{op:'m',c:[0,275]},{op:'c',c:[60,266,110,280,210,272]},
      {op:'l',c:[210,297]},{op:'l',c:[0,297]},{op:'h',c:[]}]).fill();
    doc.setFillColor(...C.cyan);
    doc.path([{op:'m',c:[0,280]},{op:'c',c:[60,271,110,284,210,278]},
      {op:'l',c:[210,297]},{op:'l',c:[0,297]},{op:'h',c:[]}]).fill();
    style(8,true,C.white);doc.text('PEOPLE  •  CARE  •  OPPORTUNITIES  •  BRIGHTER TOMORROWS',left,287);
    style(7.5,true,C.white);doc.text(value(donation.receiptNo),right,287,{align:'right'});
    if(pages>1){style(6,false,C.white);doc.text('Page '+p+' of '+pages,right,292,{align:'right'});}
  }
  doc.setPage(1);return doc;
}

export function getDonationPdfFilename(donation) {
  const safe = value => String(value || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
  return 'Receipt_' + safe(donation.receiptNo) + '_' + safe(donation.donorName) + '.pdf';
}

export function downloadDonationPdf(donation, settings) {
  generateDonationPdf(donation, settings).save(getDonationPdfFilename(donation));
}

export function printDonationReceipt(donation, settings) {
  const doc = generateDonationPdf(donation, settings);
  doc.autoPrint();
  const url = URL.createObjectURL(doc.output('blob'));
  const printWindow = window.open(url, '_blank');
  if (printWindow) { printWindow.focus(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  else URL.revokeObjectURL(url);
}
