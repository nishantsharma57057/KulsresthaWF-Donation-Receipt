import { jsPDF } from 'jspdf';

/**
 * Draws the vector Heart with Helping Hands brand mark
 */
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

/**
 * Generates exact PDF Donation Receipt matching user reference design
 */
export function generateDonationPdf(donation, settings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178 mm

  // 1. TOP-RIGHT SOFT CYAN WASH (Angled / Curved background)
  doc.saveGraphicsState();
  doc.setFillColor(235, 248, 255); // Pale Cyan
  doc.roundedRect(105, -15, 120, 60, 20, 20, 'F');
  doc.restoreGraphicsState();

  // 2. BRAND LOGO (Top Left)
  drawBrandHeartLogo(doc, margin, 14, 13);

  // Logo Typography
  doc.setTextColor(14, 38, 62); // Dark Navy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text('KULSHRESTHA', margin + 16, 19.5);

  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  // Tracking imitation
  doc.text('W E L F A R E   F O U N D A T I O N', margin + 16, 24.5);

  // Tagline underneath
  doc.setTextColor(14, 95, 118); // Deep Ocean Cyan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CARE  •  DIGNITY  •  OPPORTUNITY  •  IMPACT', margin, 32);

  // 3. TOP-RIGHT RECEIPT META
  const rightX = pageWidth - margin;
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ONLINE DONATION RECEIPT', rightX, 17, { align: 'right' });

  // Receipt No
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Receipt No.', rightX - 60, 24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(donation.receiptNo, rightX, 24, { align: 'right' });

  // Issue Date
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Issue Date', rightX - 60, 30);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(donation.date, rightX, 30, { align: 'right' });

  // 4. MAIN HEADING & SUCCESSFUL BADGE
  let y = 47;
  doc.setTextColor(14, 95, 118); // Deep Cyan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('DONATION RECEIPT', margin, y);

  // Successful indicator on right
  doc.saveGraphicsState();
  doc.setFillColor(16, 185, 129); // Emerald dot
  doc.circle(rightX - 25, y - 2, 1.4, 'F');
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SUCCESSFUL', rightX - 21.5, y - 0.7);
  doc.restoreGraphicsState();

  // Subtitle
  y += 6;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Thank you for your generous support.', margin, y);

  // Horizontal divider line
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, y, rightX, y);

  // 5. FEATURED SUMMARY CARDS (RECEIVED FROM & DONATION AMOUNT)
  y += 7;
  // Left: RECEIVED FROM
  doc.setFillColor(2, 132, 199); // Cyan accent bar
  doc.rect(margin, y, 2.5, 29, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RECEIVED FROM', margin + 6, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(donation.donorName, margin + 6, y + 14);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(donation.donorEmail || 'donor@example.com', margin + 6, y + 20);
  doc.text(donation.donorPhone, margin + 6, y + 26);

  // Right: DONATION AMOUNT Card (Soft background with rounded border)
  const amountCardX = rightX - 74;
  doc.setFillColor(250, 252, 254);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(amountCardX, y, 74, 30, 3, 3, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DONATION AMOUNT', amountCardX + 6, y + 7);

  // Draw Rupee symbol + Amount
  drawRupeeGlyph(doc, amountCardX + 6, y + 19, 7.5, [14, 95, 118]);
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(donation.amount.toLocaleString('en-IN'), amountCardX + 13, y + 19);

  // Amount In Words
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(donation.amountInWords, amountCardX + 6, y + 25);

  // 6. DONOR DETAILS & PAYMENT DETAILS (Two Columns)
  y += 39;
  // Subtle top divider
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, y - 2, rightX, y - 2);

  const col2X = margin + 98;

  // Left Column Header
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DONOR DETAILS', margin, y + 4);

  // Right Column Header
  doc.text('PAYMENT DETAILS', col2X, y + 4);

  // Rows of Key-Values
  y += 14;
  // Row 1: Name / Transaction ID
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Name', margin, y);
  doc.text('Transaction ID', col2X, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.donorName, margin + 34, y);
  doc.text(donation.transactionId || 'UPI45879214', col2X + 34, y);

  // Row 2: Mobile / Method
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Mobile', margin, y);
  doc.text('Method', col2X, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.donorPhone, margin + 34, y);
  doc.text(donation.paymentMode, col2X + 34, y);

  // Row 3: Email / Date & Time
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Email', margin, y);
  doc.text('Date / Time', col2X, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.donorEmail || 'N/A', margin + 34, y);
  doc.text(`${donation.date}, ${donation.time}`, col2X + 34, y);

  // Row 4: Address / Purpose
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Address', margin, y);
  doc.text('Purpose', col2X, y);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(donation.cause, col2X + 34, y);

  // Full donor address multiline
  const fullAddress = `${donation.donorAddress || '27 M.G. Road, Civil Lines'}, ${donation.donorCity || 'Agra'}, ${donation.donorState || 'Uttar Pradesh'} - ${donation.donorPincode || '282002'}`;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  const splitAddress = doc.splitTextToSize(fullAddress, 85);
  doc.text(splitAddress, margin, y + 6);

  // 7. CALLOUT BANNER: YOUR SUPPORT CREATES REAL CHANGE
  y += 18;
  doc.setFillColor(235, 248, 255); // Light Cyan
  doc.roundedRect(margin, y, contentWidth, 16, 2.5, 2.5, 'F');

  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('YOUR SUPPORT CREATES REAL CHANGE', margin + 6, y + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Every contribution helps us extend care, opportunity and dignity to more people.', margin + 6, y + 11.5);

  // Cyan heart icon inside banner on right
  drawBrandHeartLogo(doc, rightX - 12, y + 4.5, 7);

  // 8. FOUNDATION / TAX DETAILS & REGISTERED OFFICE CARD
  y += 24;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 31, 3, 3, 'FD');

  // Vertical divider line in the center
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 88, y + 4, margin + 88, y + 27);

  // Left Side: FOUNDATION / TAX DETAILS
  const taxLeftX = margin + 6;
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FOUNDATION / TAX DETAILS', taxLeftX, y + 7);

  // NGO PAN
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('NGO PAN', taxLeftX, y + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.pan || 'ABCDE1234F', taxLeftX + 26, y + 14);

  // 80G Reg. No.
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('80G Reg. No.', taxLeftX, y + 20);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.reg80GNumber || 'AAATK1234F/80G/2026', taxLeftX + 26, y + 20);

  // 12A Reg. No.
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('12A Reg. No.', taxLeftX, y + 26);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.reg12ANumber || 'AAATK1234F/12A/2026', taxLeftX + 26, y + 26);

  // Right Side: REGISTERED OFFICE
  const officeLeftX = margin + 94;
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REGISTERED OFFICE', officeLeftX, y + 7);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text(`${settings.orgName}, Registered Office`, officeLeftX, y + 14);
  doc.text(`${settings.address}, ${settings.city}, ${settings.state}, India`, officeLeftX, y + 19);

  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(settings.website || 'www.kulshresthawf.org', officeLeftX, y + 26);

  // 9. SIGN-OFF / COMPUTER GENERATED RECEIPT (Above footer)
  y += 42;
  // Left: Computer generated disclaimer
  doc.setTextColor(14, 95, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('COMPUTER GENERATED RECEIPT', margin, y);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const compText = 'This receipt is generated electronically from the online donation record and does not require a physical signature.';
  const splitComp = doc.splitTextToSize(compText, 100);
  doc.text(splitComp, margin, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Thank you for helping us build a brighter tomorrow.', margin, y + 17);

  // Right: Authorized Signatory
  const sigLineX = rightX - 60;
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  doc.line(sigLineX, y + 10, rightX, y + 10);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorized Signatory', sigLineX, y + 15);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(settings.orgName, sigLineX, y + 20);

  // 10. BOTTOM BANNER BAR (Solid Teal Bar)
  const bottomBarHeight = 18;
  const bottomBarY = pageHeight - bottomBarHeight;

  doc.setFillColor(14, 95, 118); // Deep Teal `#0e5f76`
  doc.rect(0, bottomBarY, pageWidth, bottomBarHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PEOPLE  •  CARE  •  OPPORTUNITIES  •  BRIGHTER TOMORROWS', margin, bottomBarY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(donation.receiptNo, rightX, bottomBarY + 11, { align: 'right' });

  return doc;
}

export function downloadDonationPdf(donation, settings) {
  const doc = generateDonationPdf(donation, settings);
  doc.save(`Receipt_${donation.receiptNo}_${donation.donorName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function printDonationReceipt(donation, settings) {
  const doc = generateDonationPdf(donation, settings);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.focus();
  }
}
