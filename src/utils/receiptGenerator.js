import { jsPDF } from 'jspdf';
import { numberToIndianWords } from './numberToWords';
import { PoppinsRegular, PoppinsSemiBold, MontserratBold } from '../assets/receiptFonts';

function drawBrandHeartLogo(doc, x, y, size) {
  doc.saveGraphicsState();
  doc.setFillColor(2, 132, 199); // Deep Cyan / Sky 600

  // Left & right lobes
  doc.circle(x + size * 0.32, y + size * 0.32, size * 0.32, 'F');
  doc.circle(x + size * 0.68, y + size * 0.32, size * 0.32, 'F');

  // Bottom triangle of heart
  doc.triangle(
    x, y + size * 0.35,
    x + size, y + size * 0.35,
    x + size * 0.5, y + size * 0.98,
    'F'
  );

  // White caring hands gesture inside
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(size * 0.09);
  doc.line(x + size * 0.22, y + size * 0.48, x + size * 0.5, y + size * 0.65);
  doc.line(x + size * 0.78, y + size * 0.48, x + size * 0.5, y + size * 0.65);
  doc.restoreGraphicsState();
}

/**
 * Draws crisp vector Indian Rupee (₹) symbol
 */
function drawRupeeGlyph(doc, x, y, height, color) {
  doc.saveGraphicsState();
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(height * 0.11);
  const w = height * 0.58;

  // Top horizontal bar
  doc.line(x, y - height * 0.88, x + w, y - height * 0.88);
  // Second horizontal bar
  doc.line(x, y - height * 0.65, x + w * 0.9, y - height * 0.65);
  // Vertical stem
  doc.line(x + w * 0.16, y - height * 0.88, x + w * 0.16, y - height * 0.38);
  // Semi-circle upper loop
  doc.line(x + w * 0.16, y - height * 0.88, x + w * 0.75, y - height * 0.88);
  doc.line(x + w * 0.75, y - height * 0.88, x + w * 0.75, y - height * 0.42);
  doc.line(x + w * 0.75, y - height * 0.42, x + w * 0.16, y - height * 0.42);
  // Diagonal leg
  doc.line(x + w * 0.3, y - height * 0.42, x + w * 0.85, y);
  doc.restoreGraphicsState();
}


const COLORS = {
  navy: [14, 38, 62], teal: [14, 95, 118], muted: [100, 116, 139],
  ink: [30, 41, 59], line: [226, 232, 240], pale: [239, 248, 252]
};

const textValue = (value) => String(value ?? '').trim() || 'Not provided';
const addressValue = (...parts) => parts.map(v => String(v ?? '').trim()).filter(Boolean).join(', ') || 'Not provided';

function displayDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return textValue(value);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? textValue(value) : date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

/** One renderer serves preview, download, print, and email attachments. */
export function generateDonationPdf(donation, settings = {}) {
  if (!donation) throw new Error('Donation details are required.');
  const amount = Number(donation.amount);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100))) throw new Error('Donation amount is invalid.');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('Poppins-Regular.ttf', PoppinsRegular);
  doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
  doc.addFileToVFS('Poppins-SemiBold.ttf', PoppinsSemiBold);
  doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'bold');
  doc.addFileToVFS('Montserrat-Bold.ttf', MontserratBold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
  const left = 16, right = 194, width = 178, bottom = 273;
  let y = 0;
  doc.setProperties({ title: 'Donation receipt - ' + textValue(donation.receiptNo),
    subject: 'Donation acknowledgement', author: textValue(settings.orgName) });
  doc.setLineHeightFactor(1.35);

  function style(size = 9, bold = false, color = COLORS.ink) {
    doc.setFont('Poppins', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
  }
  function lines(value, maxWidth, size = 9, bold = false) {
    style(size, bold);
    return doc.splitTextToSize(textValue(value), maxWidth);
  }
  function write(value, x, top, maxWidth, size = 9, bold = false, color = COLORS.ink) {
    const wrapped = lines(value, maxWidth, size, bold);
    style(size, bold, color);
    doc.text(wrapped, x, top);
    return wrapped.length * size * 0.3528 * 1.35;
  }
  function header(continued = false) {
    doc.setFillColor(...COLORS.pale);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(...COLORS.teal);
    doc.rect(0, 0, 210, 2, 'F');
    drawBrandHeartLogo(doc, left, 12, 12);
    const org = textValue(settings.orgName);
    write(org, left + 16, 16, 91, 11.5, true, COLORS.navy);
    style(7.5, false, COLORS.teal);
    doc.text('DONATION ACKNOWLEDGEMENT', left + 16, 30);
    write(donation.receiptNo, right - 52, 16, 52, 9, true, COLORS.navy);
    style(8, false, COLORS.muted);
    doc.text('Issued: ' + displayDate(donation.date), right - 52, 25);
    y = 44;
    style(21, true, COLORS.navy);
    doc.setFont('Montserrat', 'bold');
    doc.text(continued ? 'RECEIPT CONTINUED' : 'DONATION RECEIPT', left, y);
    y += 7;
    style(9, false, COLORS.muted);
    doc.text('Thank you for your generous support.', left, y);
    y += 5;
    doc.setDrawColor(...COLORS.line);
    doc.line(left, y, right, y);
    y += 8;
  }
  function ensureRoom(height) {
    if (y + height > bottom) { doc.addPage(); header(true); }
  }
  function sectionTitle(title, x, top) {
    style(8, true, COLORS.teal);
    doc.setFont('Montserrat', 'bold');
    doc.text(title, x, top);
  }

  header();
  const nameLines = lines(donation.donorName, 92, 14, true);
  const emailLines = lines(donation.donorEmail, 92, 8);
  const words = numberToIndianWords(amount);
  const wordLines = lines(words, 62, 8);
  const summaryHeight = Math.max(38, 20 + nameLines.length * 6 + emailLines.length * 4, 25 + wordLines.length * 4);
  doc.setFillColor(...COLORS.teal);
  doc.rect(left, y, 1.5, summaryHeight, 'F');
  sectionTitle('RECEIVED FROM', left + 5, y + 5);
  style(14, true, COLORS.navy);
  doc.text(nameLines, left + 5, y + 13);
  let contactY = y + 13 + nameLines.length * 6;
  style(8, false, COLORS.muted);
  doc.text(emailLines, left + 5, contactY);
  contactY += emailLines.length * 4;
  doc.text(textValue(donation.donorPhone), left + 5, contactY);

  const amountX = 120;
  doc.setFillColor(...COLORS.pale);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(amountX, y, 74, summaryHeight, 3, 3, 'FD');
  sectionTitle('DONATION AMOUNT', amountX + 6, y + 7);
  const amountText = amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  let amountSize = 21;
  style(amountSize, true);
  while (doc.getTextWidth(amountText) > 53 && amountSize > 11) { amountSize--; style(amountSize, true); }
  style(amountSize, true, COLORS.teal);
  doc.text('₹', amountX + 6, y + 20);
  doc.text(amountText, amountX + 13, y + 20);
  style(8, false, COLORS.muted);
  doc.text(wordLines, amountX + 6, y + 28);
  y += summaryHeight + 8;

  sectionTitle('DONOR DETAILS', left, y);
  sectionTitle('PAYMENT DETAILS', 110, y);
  y += 8;
  const donorFields = [
    ['Full name', donation.donorName], ['Email address', donation.donorEmail],
    ['Mobile number', donation.donorPhone], ['Donor PAN', donation.donorPan],
    ['Address', addressValue(donation.donorAddress, donation.donorCity, donation.donorState, donation.donorPincode)]
  ];
  const paymentFields = [
    ['Transaction reference', donation.transactionId], ['Payment method', donation.paymentMode],
    ['Donation date / time', [displayDate(donation.date), donation.time].filter(Boolean).join(' / ')],
    ['Donation purpose', donation.cause],
    ['80G eligibility in record', donation.is80GEligible ? 'Marked eligible' : 'Not marked eligible']
  ];
  donorFields.forEach((field, index) => {
    const other = paymentFields[index];
    const a = lines(field[1], 80, 9), b = lines(other[1], 80, 9);
    // Split unusually long fields across pages rather than clipping them.
    const count = Math.max(a.length, b.length);
    for (let offset = 0; offset < count; offset += 25) {
      const aa = a.slice(offset, offset + 25), bb = b.slice(offset, offset + 25);
      const height = 6 + Math.max(aa.length, bb.length) * 4.3;
      ensureRoom(height);
      style(7.5, false, COLORS.muted);
      doc.text(field[0] + (offset ? ' (continued)' : ''), left, y);
      doc.text(other[0] + (offset ? ' (continued)' : ''), 110, y);
      style(9, index === 0, COLORS.ink);
      if (aa.length) doc.text(aa, left, y + 5);
      if (bb.length) doc.text(bb, 110, y + 5);
      y += height;
    }
  });
  y += 3;
  ensureRoom(18);
  doc.setFillColor(...COLORS.pale);
  doc.roundedRect(left, y, width, 17, 2.5, 2.5, 'F');
  sectionTitle('YOUR SUPPORT CREATES REAL CHANGE', left + 5, y + 6);
  style(8, false, COLORS.ink);
  doc.text('Every contribution helps us extend care, opportunity and dignity.', left + 5, y + 12);
  drawBrandHeartLogo(doc, right - 12, y + 5, 6);
  y += 26;

  const taxFields = [
    ['NGO PAN', settings.pan], ['80G registration', settings.reg80GNumber],
    ['12A registration', settings.reg12ANumber], ['CIN', settings.cin]
  ];
  const office = [
    ...lines(settings.orgName, 79, 9, true),
    ...lines(addressValue(settings.address, settings.city, settings.state, settings.pincode), 79, 8.5),
    ...lines(settings.website, 79, 8)
  ];
  const taxHeight = 14 + taxFields.reduce((h, f) => h + Math.max(6, lines(f[1], 50, 8).length * 3.8 + 1), 0);
  const officeHeight = 15 + office.length * 4.3;
  const cardHeight = Math.max(taxHeight, officeHeight);
  ensureRoom(cardHeight + 5);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(left, y, width, cardHeight, 3, 3, 'S');
  doc.line(105, y + 5, 105, y + cardHeight - 5);
  sectionTitle('FOUNDATION / TAX DETAILS', left + 5, y + 7);
  sectionTitle('REGISTERED OFFICE', 110, y + 7);
  let taxY = y + 14;
  taxFields.forEach(([label, value]) => {
    style(7, false, COLORS.muted); doc.text(label, left + 5, taxY);
    const valueHeight = write(value, left + 31, taxY, 50, 8, true);
    taxY += Math.max(6, valueHeight + 1);
  });
  style(8.5, false, COLORS.ink);
  doc.text(office, 110, y + 15);
  y += cardHeight + 11;

  ensureRoom(25);
  sectionTitle('ELECTRONICALLY GENERATED RECEIPT', left, y);
  write('This receipt acknowledges the donation recorded in the foundation portal. Please retain it for your records.', left, y + 5, 100, 8, false, COLORS.muted);
  const signatory = [settings.signatoryName, settings.signatoryTitle].filter(Boolean).join('\n');
  doc.setDrawColor(...COLORS.line);
  doc.line(132, y + 9, right, y + 9);
  write(signatory || 'Authorized signatory', 132, y + 15, 62, 8.5, true, COLORS.navy);
  y += 25;

  // A consistent footer is placed on every page, outside the flowing content.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFillColor(...COLORS.teal);
    doc.rect(0, 279, 210, 18, 'F');
    style(8, true, [255, 255, 255]);
    doc.text('CARE  |  DIGNITY  |  OPPORTUNITY  |  IMPACT', left, 290);
    style(7.5, false, [255, 255, 255]);
    doc.text('Page ' + page + ' of ' + pages, right, 290, {align: 'right'});
  }
  doc.setPage(1);
  return doc;
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
