// -------------------------------------------------------------
// Kulshrestha Welfare Foundation - Google Sheets + Gmail Webhook
// This script sends receipt emails directly from your own Gmail
// and appends donation rows to your Google Sheet!
// -------------------------------------------------------------

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // -----------------------------------------------------------
    // 1. LIVE LOGIN 2FA OTP DISPATCH VIA GMAIL
    // -----------------------------------------------------------
    if (contents.action === 'sendOtp' && contents.recipientEmail) {
      var otp = contents.otpCode;
      var userName = contents.userName || "Admin";
      var otpSubject = contents.subject || ("🔐 " + otp + " is your Portal Login OTP - Kulshrestha Welfare Foundation");
      var otpBody = contents.body || (
        "Dear " + userName + ",\n\n" +
        "Your 6-digit verification code to log in to the Kulshrestha Welfare Foundation Portal is:\n\n" +
        "👉  " + otp + "  👈\n\n" +
        "This code is strictly confidential and expires in 10 minutes.\n" +
        "If you did not attempt this login, please contact support immediately.\n\n" +
        "Warm regards,\n" +
        "Security Team\n" +
        "Kulshrestha Welfare Foundation\n" +
        "Delhi | www.kulshresthawf.org"
      );

      GmailApp.sendEmail(contents.recipientEmail, otpSubject, otpBody, {
        name: "Kulshrestha Welfare Security"
      });

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "otp_sent",
        recipient: contents.recipientEmail
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Fallback if standalone script
    if (!ss && contents.spreadsheetId) {
      try {
        ss = SpreadsheetApp.openById(contents.spreadsheetId);
      } catch (err) {}
    }

    // 1. Locate sheet tab: check by name, or fall back to active/first sheet
    var sheet = null;
    if (contents.sheetName) {
      sheet = ss.getSheetByName(contents.sheetName);
    }
    if (!sheet) {
      sheet = ss.getActiveSheet() || ss.getSheets()[0];
    }
    if (!sheet) {
      sheet = ss.insertSheet(contents.sheetName || "Donations_2026_27");
    }

    // Initialize headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Receipt No", "Date", "Time", "Donor Name", "Phone",
        "Email", "PAN", "Amount (INR)", "Cause", "Payment Mode",
        "Transaction Ref", "80G Exemption", "Address", "Notes", "Logged At"
      ]);
      sheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#E0F2FE");
    }

    // 2. ALWAYS RECORD / UPDATE DONATION IN GOOGLE SHEET
    if (contents.donation) {
      var d = contents.donation;
      var receiptNo = d.receiptNo || "";
      var existingRowIndex = -1;
      var lastRow = sheet.getLastRow();

      if (lastRow > 1 && receiptNo) {
        var receiptColumnValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var r = 0; r < receiptColumnValues.length; r++) {
          if (String(receiptColumnValues[r][0]).trim() === String(receiptNo).trim()) {
            existingRowIndex = r + 2;
            break;
          }
        }
      }

      var rowData = [
        d.receiptNo || "",
        d.date || Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd"),
        d.time || Utilities.formatDate(new Date(), "Asia/Kolkata", "HH:mm"),
        d.donorName || "",
        d.donorPhone || "",
        d.donorEmail || "",
        d.donorPan || "",
        d.amount || "",
        d.cause || "",
        d.paymentMode || "",
        d.transactionId || "",
        d.is80GEligible || "YES",
        d.address || "",
        d.notes || "",
        d.timestamp || new Date().toISOString()
      ];

      if (existingRowIndex > 0) {
        sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
    }

    // 3. AUTO-SEND EMAIL WITH OFFICIAL 80G PDF ATTACHMENT
    var don = contents.donation || {};
    var recipientEmail = contents.recipientEmail || don.donorEmail;

    if (recipientEmail && recipientEmail.indexOf("@") !== -1) {
      var subject = contents.subject || ("Official 80G Donation Receipt [" + (don.receiptNo || "") + "] - Kulshrestha Welfare Foundation");
      var body = contents.body || (
        "Dear " + (don.donorName || "Donor") + ",\n\n" +
        "Thank you for your generous donation of Rs. " + (don.amount || "") + " towards " + (don.cause || "our welfare initiative") + ".\n\n" +
        "Receipt No: " + (don.receiptNo || "") + "\n" +
        "Date: " + (don.date || "") + "\n" +
        "Payment Mode: " + (don.paymentMode || "") + " (Ref: " + (don.transactionId || "N/A") + ")\n\n" +
        "Please find attached your official 80G Tax Exemption Donation Receipt in PDF format.\n\n" +
        "Warm regards,\n" +
        "Kulshrestha Welfare Foundation\n" +
        "Delhi | www.kulshresthawf.org"
      );

      var mailOptions = {
        name: "Kulshrestha Welfare Foundation"
      };

      // Render the receipt-style HTML and embed the original logo/signature.
      if (contents.htmlBody) mailOptions.htmlBody = contents.htmlBody;
      if (contents.inlineImages) {
        mailOptions.inlineImages = {};
        Object.keys(contents.inlineImages).forEach(function(key) {
          var image = contents.inlineImages[key];
          mailOptions.inlineImages[key] = Utilities.newBlob(Utilities.base64Decode(image.data), image.mimeType || "image/png", key);
        });
      }

      // ATTACH THE PDF FILE
      if (contents.pdfBase64) {
        var decodedBytes = Utilities.base64Decode(contents.pdfBase64);
        var fileName = contents.pdfFileName || ("Receipt_" + (don.receiptNo || "80G") + ".pdf");
        var pdfBlob = Utilities.newBlob(decodedBytes, "application/pdf", fileName);
        mailOptions.attachments = [pdfBlob];
      }

      GmailApp.sendEmail(recipientEmail, subject, body, mailOptions);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", attached: !!contents.pdfBase64 }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}