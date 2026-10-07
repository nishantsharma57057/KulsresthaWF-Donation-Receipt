// -------------------------------------------------------------
// Kulshrestha Welfare Foundation - Google Sheets + Gmail Webhook
// This script sends receipt emails directly from your own Gmail
// and appends donation rows to your Google Sheet!
// -------------------------------------------------------------

// Fixed organization sender; never silently fall back to a personal Gmail address.
var KWF_SENDER_EMAIL = "kulsresthawf@gmail.com";

function kwfSenderOptions(senderName) {
  var options = { name: senderName, replyTo: KWF_SENDER_EMAIL };
  var aliases = GmailApp.getAliases();
  var matchingAlias = aliases.filter(function(address) {
    return address.toLowerCase() === KWF_SENDER_EMAIL;
  })[0];
  if (matchingAlias) {
    options.from = matchingAlias;
    return options;
  }
  var accountEmail = Session.getEffectiveUser().getEmail().toLowerCase();
  if (accountEmail === KWF_SENDER_EMAIL) return options;
  throw new Error("Sender setup required: deploy this Web App with Execute as Me using the kulsresthawf@gmail.com account.");
}

function doPost(e) {
  var stage = "parse_request";
  try {
    var contents = JSON.parse(e.postData.contents);

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

      stage = "send_otp";
      GmailApp.sendEmail(contents.recipientEmail, otpSubject, otpBody, kwfSenderOptions("Kulshrestha Welfare Security"));

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "otp_sent",
        recipient: contents.recipientEmail
      })).setMimeType(ContentService.MimeType.JSON);
    }

    stage = "sheet_sync";
    var sheetError = null;
    var sheetSynced = false;
    if (contents.donation && contents.syncToSheet !== false) {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        // Fallback if standalone script
        if (!ss && contents.spreadsheetId) {
          try {
            ss = SpreadsheetApp.openById(contents.spreadsheetId);
          } catch (err) { throw new Error('Unable to open the configured Google Sheet: ' + err.message); }
        }
    
        if (!ss) throw new Error('Google Sheet is not linked. Configure a Spreadsheet ID for sync; email delivery is independent.');
    
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
    
    
        sheetSynced = true;
      } catch (syncError) {
        sheetError = String(syncError.message || syncError);
        console.warn('Donation sheet sync failed; continuing email delivery: ' + sheetError);
      }
    }

    // 3. AUTO-SEND EMAIL WITH OFFICIAL 80G PDF ATTACHMENT
    var don = contents.donation || {};
    var recipientEmail = contents.recipientEmail || don.donorEmail;

    var emailSent = false;
    if (contents.sendEmail !== false && recipientEmail && recipientEmail.indexOf("@") !== -1) {
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

      stage = "check_sender";
      var mailOptions = kwfSenderOptions("Kulshrestha Welfare Foundation");

      stage = "prepare_email_assets";
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

      stage = "send_receipt";
      GmailApp.sendEmail(recipientEmail, subject, body, mailOptions);
      emailSent = true;
    }

    console.log("KWF receipt result: emailSent=" + emailSent + ", sheetSynced=" + sheetSynced + ", pdfAttached=" + (emailSent && !!contents.pdfBase64));
    return ContentService.createTextOutput(JSON.stringify({ status: sheetError ? (emailSent ? "partial_success" : "error") : "success", emailSent: emailSent, sheetSynced: sheetSynced, sheetError: sheetError, attached: emailSent && !!contents.pdfBase64 }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("KWF webhook failed at " + stage + ": " + String(err.message || err));
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
// Run this function from the editor while signed in as the intended sender.
// This checks authorization/sender setup without sending any email.
function kwfCheckEmailSetup() {
  try {
    kwfSenderOptions("Kulshrestha Welfare Foundation");
    var remaining = MailApp.getRemainingDailyQuota();
    console.log("KWF sender setup OK; remaining daily recipient quota: " + remaining);
    if (remaining === 0) console.warn("Daily email recipient quota is exhausted.");
    return { senderConfigured: true, remainingRecipientQuota: remaining };
  } catch (err) {
    console.error("KWF sender check failed: " + String(err.message || err));
    throw err;
  }
}
