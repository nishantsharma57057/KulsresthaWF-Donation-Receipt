import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { formatIndianCurrency } from '../utils/numberToWords';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Code,
  ShieldCheck,
  Send,
  Download,
  Info
} from 'lucide-react';

export const GoogleSheetSyncHub = ({
  donations,
  settings,
  onSettingsUpdate,
  onSyncAll,
  isSyncing,
  onSyncSingle
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhookUrl || '');
  const [sheetName, setSheetName] = useState(settings.googleSheetsSheetName || 'Donations_2026_27');
  const [autoSync, setAutoSync] = useState(settings.isGoogleSheetAutoSync);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const syncLogs = StorageService.getSyncLogs();
  const syncedDonations = donations.filter((d) => d.googleSheetStatus === 'synced');
  const pendingDonations = donations.filter((d) => d.googleSheetStatus !== 'synced');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = StorageService.updateNgoSettings({
      googleSheetsWebhookUrl: webhookUrl.trim(),
      googleSheetsSheetName: sheetName.trim(),
      isGoogleSheetAutoSync: autoSync
    });
    onSettingsUpdate(updated);
    alert('Google Sheets integration settings updated!');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (webhookUrl.trim()) {
        const payload = {
          action: 'testPing',
          timestamp: new Date().toISOString(),
          org: settings.orgName
        };

        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        setTestResult('Ping dispatched to Google Apps Script Webhook successfully!');
      } else {
        setTimeout(() => {
          setTestResult(
            'Google Sheets webhook is not configured.'
          );
        }, 500);
      }
    } catch (err) {
      setTestResult('Error sending test request: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const sampleAppsScriptCode = `// -------------------------------------------------------------
// Kulshrestha Welfare Foundation - Google Sheets Sync Webhook
// Paste this code in Google Sheet -> Extensions -> Apps Script
// Then click "Deploy" -> "New Deployment" -> Select "Web App"
// Set "Execute as: Me" and "Who has access: Anyone" -> Copy Web App URL
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

      GmailApp.sendEmail(contents.recipientEmail, otpSubject, otpBody, kwfSenderOptions("Kulshrestha Welfare Security"));

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
        "Receipt No",
        "Date",
        "Time",
        "Donor Name",
        "Phone / WhatsApp",
        "Email",
        "PAN",
        "Amount (INR)",
        "Cause / Project",
        "Payment Mode",
        "Transaction Ref",
        "80G Exemption",
        "Address",
        "Notes",
        "Logged At"
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

      var mailOptions = kwfSenderOptions("Kulshrestha Welfare Foundation");

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

  const copyAppsScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Google Sheets Live Sync Hub</h1>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Integration
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit donation sync requests to your configured Google Apps Script webhook. Confirmation requires checking Sheets or the script logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSyncAll}
            disabled={isSyncing || pendingDonations.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : `Sync Pending (${pendingDonations.length})`}</span>
          </button>

          <button
            onClick={() => StorageService.exportDonationsToCsv()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Total Synced Rows</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {syncedDonations.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Math.round((syncedDonations.length / (donations.length || 1)) * 100)}% of total ledger records
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Pending Synchronization</div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${pendingDonations.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {pendingDonations.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {pendingDonations.length === 0 ? 'No pending requests' : 'Awaiting sync or confirmation'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Target Worksheet</div>
          <div className="text-base font-bold text-slate-900 truncate">
            {settings.googleSheetsSheetName}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Auto-sync on submission: {settings.isGoogleSheetAutoSync ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* Local records; not a readback from Google Sheets. */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Local Donation Ledger [{settings.googleSheetsSheetName}]
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Columns: A to O · Total {donations.length} rows recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-emerald-50/50 text-slate-700 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">A: Receipt No</th>
                <th className="py-2.5 px-3">B: Date</th>
                <th className="py-2.5 px-3">C: Donor Name</th>
                <th className="py-2.5 px-3">D: Mobile</th>
                <th className="py-2.5 px-3">E: PAN</th>
                <th className="py-2.5 px-3 text-right">F: Amount (₹)</th>
                <th className="py-2.5 px-3">G: Cause</th>
                <th className="py-2.5 px-3">H: Payment Mode</th>
                <th className="py-2.5 px-3">I: Txn ID</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              {donations.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 2}</td>
                  <td className="py-2 px-3 font-mono font-bold text-sky-700">{d.receiptNo}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-slate-600">{d.date}</td>
                  <td className="py-2 px-3 font-medium text-slate-900 truncate max-w-[140px]">{d.donorName}</td>
                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{d.donorPhone}</td>
                  <td className="py-2 px-3 font-mono uppercase text-slate-700">{d.donorPan || '-'}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{d.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 px-3 text-slate-700 truncate max-w-[120px]">{d.cause}</td>
                  <td className="py-2 px-3 text-slate-600">{d.paymentMode}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[100px]">{d.transactionId}</td>
                  <td className="py-2 px-3 text-center">
                    {d.googleSheetStatus === 'synced' ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        SYNCED
                      </span>
                    ) : (
                      <button
                        onClick={() => onSyncSingle(d.id)}
                        className="text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
                      >
                        SYNC
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Configuration & Apps Script Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Settings Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Google Sheet Webhook Settings</h3>
            <span className="text-[11px] text-slate-500">Live Endpoint</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Google Apps Script Webhook URL (Optional)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your Google Apps Script webhook URL. An empty URL cannot sync donations to Google Sheets.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Target Sheet / Tab Name
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Donations_2026_27"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="auto-sync-check"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="auto-sync-check" className="text-xs text-slate-700 cursor-pointer">
                Automatically push new donation entry to Google Sheet upon form submission
              </label>
            </div>

            {testResult && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{testResult}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isTesting ? 'Pinging...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Save Integration Settings
              </button>
            </div>
          </form>
        </div>

        {/* 1-Click Ready Apps Script Guide */}
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Google Apps Script Connector
              </h3>
            </div>
            <button
              onClick={copyAppsScript}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[11px] font-semibold transition-colors"
            >
              {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied Script!' : 'Copy Script'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Want your live Google Sheet to receive entries directly? Open your Google Sheet, go to{' '}
            <strong className="text-white">Extensions &gt; Apps Script</strong>, paste this script, deploy as a Web App with access set to "Anyone", and paste the resulting URL on the left.
          </p>

          <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-300 max-h-48 overflow-y-auto leading-normal border border-slate-800">
            {sampleAppsScriptCode}
          </pre>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Supports auto-header creation & row appending</span>
            <span className="text-emerald-400 font-medium">Ready to deploy</span>
          </div>
        </div>

      </div>

    </div>
  );
};
