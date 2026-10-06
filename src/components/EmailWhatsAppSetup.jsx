import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import {
  Mail,
  MessageCircle,
  Copy,
  Check,
  Code,
  CheckCircle2,
  Info,
  Save
} from 'lucide-react';

export const EmailWhatsAppSetup = ({
  settings,
  onUpdateSettings
}) => {
  const [senderEmail, setSenderEmail] = useState(settings?.senderEmail || 'nishantsharma57057@gmail.com');
  const [senderName, setSenderName] = useState(settings?.senderName || 'Kulshrestha Welfare Foundation');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappSenderNumber || '+91 98112 34567');
  const [whatsappTemplate, setWhatsappTemplate] = useState(settings?.whatsappTemplate || '');
  const [autoEmail, setAutoEmail] = useState(settings?.isAutoEmailReceipt ?? true);

  const [copiedScript, setCopiedScript] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);

  const googleAppsScriptWithGmail = `// -------------------------------------------------------------
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
        "Dear " + userName + ",\\n\\n" +
        "Your 6-digit verification code to log in to the Kulshrestha Welfare Foundation Portal is:\\n\\n" +
        "👉  " + otp + "  👈\\n\\n" +
        "This code is strictly confidential and expires in 10 minutes.\\n" +
        "If you did not attempt this login, please contact support immediately.\\n\\n" +
        "Warm regards,\\n" +
        "Security Team\\n" +
        "Kulshrestha Welfare Foundation\\n" +
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
        "Dear " + (don.donorName || "Donor") + ",\\n\\n" +
        "Thank you for your generous donation of Rs. " + (don.amount || "") + " towards " + (don.cause || "our welfare initiative") + ".\\n\\n" +
        "Receipt No: " + (don.receiptNo || "") + "\\n" +
        "Date: " + (don.date || "") + "\\n" +
        "Payment Mode: " + (don.paymentMode || "") + " (Ref: " + (don.transactionId || "N/A") + ")\\n\\n" +
        "Please find attached your official 80G Tax Exemption Donation Receipt in PDF format.\\n\\n" +
        "Warm regards,\\n" +
        "Kulshrestha Welfare Foundation\\n" +
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
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptWithGmail);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updated = StorageService.updateNgoSettings({
      senderEmail: senderEmail.trim(),
      senderName: senderName.trim(),
      whatsappSenderNumber: whatsappNumber.trim(),
      whatsappTemplate,
      isAutoEmailReceipt: autoEmail
    });

    if (onUpdateSettings) onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone) { setTestEmailStatus('Enter your WhatsApp number first.'); return; }
    const message = 'Kulshrestha Welfare Foundation: WhatsApp configuration test. No donation receipt is attached.';
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTestEmail = () => {
    setTestEmailStatus('Delivery is not verified here. Submit a receipt email request and check the configured sender inbox and Apps Script execution logs.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold mb-1">
            <span>Communication Setup</span>
            <span aria-hidden="true">·</span>
            <span>Gmail & WhatsApp</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Gmail & WhatsApp Integration Setup
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your own Gmail account and WhatsApp number so donors receive 80G receipts directly from your Foundation.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Saved Successfully</span>
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: GMAIL CONFIGURATION */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Own Gmail Configuration (Free Google Apps Script / SMTP)
              </h3>
              <p className="text-[11px] text-slate-500">
                Send 80G PDF receipt emails from your own email ({senderEmail})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Your Gmail / Official Sender Email
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. nishantsharma57057@gmail.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Emails to donors will be sent using this email as the sender.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Kulshrestha Welfare Foundation"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* How to Connect Gmail for Free */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  How to send emails automatically from your own Gmail (Free Setup):
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold transition-colors"
              >
                {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScript ? 'Copied Apps Script!' : 'Copy Gmail Script'}</span>
              </button>
            </div>

            <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>
                Open your Google Sheet, click <strong className="text-white">Extensions &gt; Apps Script</strong>.
              </li>
              <li>
                Replace the code with the script below (uses Google's built-in <code className="text-emerald-400 font-mono">GmailApp.sendEmail()</code>).
              </li>
              <li>
                Click <strong className="text-white">Deploy &gt; New Deployment &gt; Web App</strong>.
              </li>
              <li>
                Select <strong className="text-white">Execute as: Me ({senderEmail})</strong> and <strong className="text-white">Who has access: Anyone</strong>.
              </li>
              <li>
                Paste your Webhook URL in the Google Sheet tab. Every donation submitted will automatically send an email from your Gmail for free!
              </li>
            </ol>

            <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-300 max-h-36 overflow-y-auto border border-slate-800">
              {googleAppsScriptWithGmail}
            </pre>
          </div>

          {testEmailStatus && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{testEmailStatus}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEmail}
                onChange={(e) => setAutoEmail(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="font-semibold">Auto-send receipt email immediately when donation form is submitted</span>
            </label>

            <button
              type="button"
              onClick={handleTestEmail}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Test Email Sender
            </button>
          </div>
        </div>

        {/* Section 2: WHATSAPP CONFIGURATION */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. WhatsApp Dispatch Setup
              </h3>
              <p className="text-[11px] text-slate-500">
                Send 80G tax receipts directly to donor's WhatsApp number with 1-click or automated trigger
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Your Organization WhatsApp Number (with Country Code)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 98112 34567"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: +91XXXXXXXXXX (Used for sending receipts)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                How WhatsApp Sending Works:
              </label>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                When a donation is saved, the portal automatically formats the official 80G message with the donor's name, amount, cause, and direct PDF download link, opening directly into WhatsApp Web or mobile app.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                WhatsApp Receipt Message Template
              </label>
              <span className="text-[11px] text-slate-400">
                Dynamic Variables: {'{DONOR_NAME}'}, {'{AMOUNT}'}, {'{CAUSE}'}, {'{RECEIPT_NO}'}, {'{RECEIPT_URL}'}
              </span>
            </div>
            <textarea
              rows={8}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleTestWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test WhatsApp Message (Open WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* Section 3: Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all focus:ring-2 focus:ring-sky-500 active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>Save Gmail & WhatsApp Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
