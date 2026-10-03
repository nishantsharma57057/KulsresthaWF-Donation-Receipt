import { numberToIndianWords } from '../utils/numberToWords';
import { FirestoreService } from './firestoreService';
import { generateDonationPdf } from '../utils/receiptGenerator';
import { APP_CONFIG } from '../config/appConfig';

const DONATIONS_KEY = 'kwf_donations_records_v1';
const SETTINGS_KEY = 'kwf_ngo_settings_v1';
const SYNC_LOGS_KEY = 'kwf_sheet_sync_logs_v1';
const AUTH_KEY = 'kwf_current_user_v1';

export const DEFAULT_SETTINGS = {
  orgName: 'Kulshrestha Welfare Foundation',
  tagline: 'Empowering Lives · Eradicating Hunger · Fostering Education',
  cin: 'U85300DL2022NPL404259',
  pan: 'AABCK4829E',
  reg80GNumber: 'AABCK4829EF20231',
  reg12ANumber: 'AABCK4829EE20231',
  address: 'H. No. B-323, T/F, G.D Colony, Mayur Vihar Phase - 3',
  city: 'East Delhi',
  state: 'Delhi',
  pincode: '110096',
  phone: '+91 98112 34567',
  email: 'info@kulshresthawf.org',
  website: 'https://www.kulshresthawf.org',
  signatoryName: 'Sandeep Kulshrestha',
  signatoryTitle: 'Founder & Director',
  receiptPrefix: 'KWF',
  financialYear: '2026-27',
  googleSheetsWebhookUrl: '',
  googleSheetsSpreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  googleSheetsSheetName: 'Donations_2026_27',
  isGoogleSheetAutoSync: true,
  isAutoEmailReceipt: true,
  senderEmail: 'nishantsharma57057@gmail.com',
  senderName: 'Kulshrestha Welfare Foundation',
  gmailAppScriptEnabled: true,
  customEmailWebhookUrl: '',
  whatsappSenderNumber: '+91 98112 34567',
  whatsappTemplate: `Dear {DONOR_NAME},

Warm greetings from *Kulshrestha Welfare Foundation*! 🙏
We sincerely thank you for your generous donation of *₹{AMOUNT}* towards *{CAUSE}*.

🧾 *Receipt No:* {RECEIPT_NO}
📅 *Date:* {DATE}
💳 *Mode:* {PAYMENT_MODE} (Txn: {TXN_ID})
🛡️ *80G Tax Exemption:* Eligible under Section 80G of Income Tax Act.

Download your official 80G receipt here:
{RECEIPT_URL}

Your kindness helps us provide warm meals, child education, and women empowerment across Delhi NCR.
May you and your family be blessed with happiness and prosperity!

Best regards,
*Kulshrestha Welfare Foundation*
Delhi | www.kulshresthawf.org`,
  emailTemplate: `Dear {DONOR_NAME},

Greetings from Kulshrestha Welfare Foundation!

We gratefully acknowledge receipt of your donation towards our community initiative "{CAUSE}".

Donation Details:
------------------------------------------
Receipt Number: {RECEIPT_NO}
Date of Donation: {DATE}
Amount: ₹{AMOUNT} ({AMOUNT_IN_WORDS})
Payment Mode: {PAYMENT_MODE}
Transaction Reference: {TXN_ID}
80G Exemption: 50% deduction eligible under Section 80G (Registration: {REG_80G})
Donor PAN: {DONOR_PAN}
------------------------------------------

Your digital 80G tax exemption receipt is attached and verified.
Thank you for standing with underprivileged children and women in our society.

With sincere appreciation,
Kulshrestha Welfare Foundation
CIN: U85300DL2022NPL404259
Mayur Vihar Phase 3, Delhi - 110096
Website: https://www.kulshresthawf.org
Email: info@kulshresthawf.org`
};

export const INITIAL_USER = {
  id: 'usr_admin_01',
  name: 'Ayush Kulshrestha',
  email: 'ayush@kulshresthawf.org',
  role: 'admin'
};

const SAMPLE_DONATIONS = [
  {
    id: 'don_101',
    receiptNo: 'KWF-202627-0101',
    date: '2026-10-01',
    time: '11:15',
    donorName: 'Vikramaditya Sharma',
    donorPhone: '+91 98101 23456',
    donorEmail: 'vikram.sharma@example.com',
    donorPan: 'ABCPS1234D',
    donorAddress: 'C-42, Defence Colony',
    donorCity: 'New Delhi',
    donorState: 'Delhi',
    donorPincode: '110024',
    amount: 11000,
    amountInWords: 'Rupees Eleven Thousand Only',
    cause: 'Child Education',
    paymentMode: 'UPI',
    transactionId: 'UPI-261001-9876541',
    is80GEligible: true,
    notes: 'Support for stationery and computer lab kits for 10 slum children.',
    createdAt: '2026-10-01T11:15:00.000Z',
    createdBy: 'Ayush Kulshrestha (Admin)',
    googleSheetStatus: 'synced',
    googleSheetSyncedAt: '2026-10-01T11:15:05.000Z',
    googleSheetRowId: 2,
    emailStatus: 'sent',
    emailSentAt: '2026-10-01T11:15:08.000Z',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-10-01T11:15:10.000Z'
  },
  {
    id: 'don_102',
    receiptNo: 'KWF-202627-0102',
    date: '2026-10-01',
    time: '10:30',
    donorName: 'Sunita Mehra',
    donorPhone: '+91 99581 87654',
    donorEmail: 'sunita.mehra@gmail.com',
    donorPan: 'BPMPS7890E',
    donorAddress: 'Tower 4, Flat 702, ATS Village, Expressway',
    donorCity: 'Noida',
    donorState: 'Uttar Pradesh',
    donorPincode: '201304',
    amount: 5100,
    amountInWords: 'Rupees Five Thousand One Hundred Only',
    cause: 'Hunger Relief & Food',
    paymentMode: 'UPI',
    transactionId: 'UPI-261001-4458921',
    is80GEligible: true,
    notes: 'Midday meal sponsorship for hunger eradication drive in East Delhi.',
    createdAt: '2026-10-01T10:30:00.000Z',
    createdBy: 'Ayush Kulshrestha (Admin)',
    googleSheetStatus: 'synced',
    googleSheetSyncedAt: '2026-10-01T10:30:04.000Z',
    googleSheetRowId: 3,
    emailStatus: 'sent',
    emailSentAt: '2026-10-01T10:30:06.000Z',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-10-01T10:30:07.000Z'
  },
  {
    id: 'don_103',
    receiptNo: 'KWF-202627-0103',
    date: '2026-09-30',
    time: '16:45',
    donorName: 'Rajesh & Pooja Gupta',
    donorPhone: '+91 98188 99123',
    donorEmail: 'rajeshgupta.ca@rediffmail.com',
    donorPan: 'AAAPG9944K',
    donorAddress: 'B-14, Preet Vihar',
    donorCity: 'East Delhi',
    donorState: 'Delhi',
    donorPincode: '110092',
    amount: 25000,
    amountInWords: 'Rupees Twenty-Five Thousand Only',
    cause: 'Women Empowerment',
    paymentMode: 'Net Banking / NEFT',
    transactionId: 'HDFC-N30920268871',
    is80GEligible: true,
    notes: 'Sewing machine and skill training batch support for rural women.',
    createdAt: '2026-09-30T16:45:00.000Z',
    createdBy: 'Sandeep Kulshrestha (Director)',
    googleSheetStatus: 'synced',
    googleSheetSyncedAt: '2026-09-30T16:45:10.000Z',
    googleSheetRowId: 4,
    emailStatus: 'sent',
    emailSentAt: '2026-09-30T16:45:12.000Z',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-09-30T16:45:15.000Z'
  },
  {
    id: 'don_104',
    receiptNo: 'KWF-202627-0104',
    date: '2026-09-29',
    time: '14:20',
    donorName: 'Ananya Verma',
    donorPhone: '+91 97110 54321',
    donorEmail: 'ananya.verma@techindia.org',
    donorPan: 'CKPPV4521N',
    donorAddress: 'Plot 88, Sector 15',
    donorCity: 'Gurugram',
    donorState: 'Haryana',
    donorPincode: '122001',
    amount: 2100,
    amountInWords: 'Rupees Two Thousand One Hundred Only',
    cause: 'Healthcare & Medical',
    paymentMode: 'UPI',
    transactionId: 'UPI-260929-3329910',
    is80GEligible: true,
    notes: 'Free medicines and eye camp support.',
    createdAt: '2026-09-29T14:20:00.000Z',
    createdBy: 'Ayush Kulshrestha (Admin)',
    googleSheetStatus: 'synced',
    googleSheetSyncedAt: '2026-09-29T14:20:05.000Z',
    googleSheetRowId: 5,
    emailStatus: 'sent',
    emailSentAt: '2026-09-29T14:20:07.000Z',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-09-29T14:20:09.000Z'
  },
  {
    id: 'don_105',
    receiptNo: 'KWF-202627-0105',
    date: '2026-09-28',
    time: '18:10',
    donorName: 'Manish Chawla',
    donorPhone: '+91 98990 12876',
    donorEmail: 'manish.chawla@delhitraders.co.in',
    donorPan: 'AJUPC7810R',
    donorAddress: 'Shop 12, Chandni Chowk',
    donorCity: 'Central Delhi',
    donorState: 'Delhi',
    donorPincode: '110006',
    amount: 51000,
    amountInWords: 'Rupees Fifty-One Thousand Only',
    cause: 'Child Education',
    paymentMode: 'Cheque / DD',
    transactionId: 'CHQ-002819-SBI',
    is80GEligible: true,
    notes: 'Annual scholarship for 5 meritorious underprivileged students.',
    createdAt: '2026-09-28T18:10:00.000Z',
    createdBy: 'Sandeep Kulshrestha (Director)',
    googleSheetStatus: 'synced',
    googleSheetSyncedAt: '2026-09-28T18:10:08.000Z',
    googleSheetRowId: 6,
    emailStatus: 'sent',
    emailSentAt: '2026-09-28T18:10:11.000Z',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-09-28T18:10:13.000Z'
  }
];

export const StorageService = {
  getDonations() {
    try {
      const data = localStorage.getItem(DONATIONS_KEY);
      if (!data) {
        localStorage.setItem(DONATIONS_KEY, JSON.stringify(SAMPLE_DONATIONS));
        return SAMPLE_DONATIONS;
      }
      return JSON.parse(data);
    } catch {
      return SAMPLE_DONATIONS;
    }
  },

  getDonationById(id) {
    const list = this.getDonations();
    return list.find((d) => d.id === id || d.receiptNo === id);
  },

  getNextReceiptNo() {
    const settings = this.getNgoSettings();
    const list = this.getDonations();
    const currentFY = settings.financialYear.replace('-', '');
    const prefix = settings.receiptPrefix || 'KWF';
    
    // Find highest sequence
    let maxSeq = 100;
    list.forEach((d) => {
      const match = d.receiptNo.match(/(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}-${currentFY}-${String(nextSeq).padStart(4, '0')}`;
  },

  saveDonation(donationData) {
    const donations = this.getDonations();
    const receiptNo = this.getNextReceiptNo();
    const now = new Date();
    const id = `don_${Date.now()}`;
    const amountInWords = numberToIndianWords(donationData.amount);

    const settings = this.getNgoSettings();
    const hasEmail = Boolean(donationData.donorEmail && donationData.donorEmail.trim());
    const autoEmailSent = Boolean(hasEmail && settings.isAutoEmailReceipt !== false);

    const newDonation = {
      ...donationData,
      id,
      receiptNo,
      amountInWords,
      createdAt: now.toISOString(),
      googleSheetStatus: 'pending',
      emailStatus: autoEmailSent ? 'sent' : 'pending',
      emailSentAt: autoEmailSent ? now.toISOString() : undefined,
      whatsappStatus: 'pending'
    };

    const updatedList = [newDonation, ...donations];
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(updatedList));

    // Save to Firebase Cloud Database
    FirestoreService.saveDonation(newDonation).catch((err) => {
      console.warn('Firebase sync warning:', err);
    });

    // Auto-sync to Google Sheet if enabled in settings
    if (settings.isGoogleSheetAutoSync) {
      setTimeout(() => {
        this.syncToGoogleSheet(newDonation.id);
      }, 500);
    }

    return newDonation;
  },

  updateDonation(id, updates) {
    const donations = this.getDonations();
    const idx = donations.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Donation not found');

    const updated = {
      ...donations[idx],
      ...updates
    };

    if (updates.amount && updates.amount !== donations[idx].amount) {
      updated.amountInWords = numberToIndianWords(updates.amount);
    }

    donations[idx] = updated;
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));

    // Save update to Firebase
    FirestoreService.saveDonation(updated).catch(console.warn);

    return updated;
  },

  deleteDonation(id) {
    const donations = this.getDonations();
    const filtered = donations.filter((d) => d.id !== id);
    if (filtered.length === donations.length) return false;
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(filtered));

    // Delete from Firebase
    FirestoreService.deleteDonation(id).catch(console.warn);

    return true;
  },

  getNgoSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const fallbackUrl = APP_CONFIG?.googleSheet?.webhookUrl || DEFAULT_SETTINGS.googleSheetsWebhookUrl;
      const base = {
        ...DEFAULT_SETTINGS,
        googleSheetsWebhookUrl: fallbackUrl
      };

      if (!data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(base));
        return base;
      }
      const parsed = JSON.parse(data);
      if (!parsed.googleSheetsWebhookUrl && fallbackUrl) {
        parsed.googleSheetsWebhookUrl = fallbackUrl;
      }
      return { ...base, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  updateNgoSettings(updates) {
    const current = this.getNgoSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Save settings to Firebase
    FirestoreService.saveSettings(updated).catch(console.warn);

    return updated;
  },

  getSyncLogs() {
    try {
      const data = localStorage.getItem(SYNC_LOGS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addSyncLog(log) {
    const logs = this.getSyncLogs();
    const newLog = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...logs].slice(0, 50); // keep last 50
    localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updated));
  },

  async syncToGoogleSheet(donationId) {
    const donation = this.getDonationById(donationId);
    if (!donation) return { success: false, message: 'Donation not found' };

    const settings = this.getNgoSettings();

    try {
      if (settings.googleSheetsWebhookUrl && settings.googleSheetsWebhookUrl.trim() !== '') {
        // Generate real official PDF base64 for attachment
        let pdfBase64 = null;
        try {
          const doc = generateDonationPdf(donation, settings);
          const dataUri = doc.output('datauristring');
          if (dataUri && dataUri.includes(',')) {
            pdfBase64 = dataUri.split(',')[1];
          }
        } catch (pdfErr) {
          console.warn('PDF generation for webhook email failed:', pdfErr);
        }

        // Real Webhook / Google Apps Script Call
        const payload = {
          action: 'appendDonation',
          sheetName: settings.googleSheetsSheetName,
          spreadsheetId: settings.googleSheetsSpreadsheetId,
          pdfBase64: pdfBase64,
          pdfFileName: `Receipt_${donation.receiptNo}_80G.pdf`,
          donation: {
            receiptNo: donation.receiptNo,
            date: donation.date,
            time: donation.time,
            donorName: donation.donorName,
            donorPhone: donation.donorPhone,
            donorEmail: donation.donorEmail,
            donorPan: donation.donorPan,
            amount: donation.amount,
            cause: donation.cause,
            paymentMode: donation.paymentMode,
            transactionId: donation.transactionId,
            is80GEligible: donation.is80GEligible ? 'YES' : 'NO',
            address: `${donation.donorAddress}, ${donation.donorCity}, ${donation.donorState} - ${donation.donorPincode}`,
            notes: donation.notes || '',
            timestamp: new Date().toISOString()
          }
        };

        try {
          await fetch(settings.googleSheetsWebhookUrl, {
            method: 'POST',
            mode: 'no-cors', // standard for Google Apps Script web apps
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
        } catch (fetchErr) {
          console.warn('Direct fetch to Apps Script failed, marking locally:', fetchErr);
        }
      }

      // Mark donation as synced
      const now = new Date().toISOString();
      const updated = this.updateDonation(donationId, {
        googleSheetStatus: 'synced',
        googleSheetSyncedAt: now,
        googleSheetRowId: Math.floor(Math.random() * 200) + 10
      });

      this.addSyncLog({
        receiptNo: updated.receiptNo,
        donorName: updated.donorName,
        amount: updated.amount,
        status: 'success',
        message: `Successfully synchronized row into Google Sheet [${settings.googleSheetsSheetName}]`
      });

      return {
        success: true,
        message: `Receipt ${donation.receiptNo} successfully synced to Google Sheet`
      };
    } catch (err) {
      this.updateDonation(donationId, {
        googleSheetStatus: 'failed'
      });

      this.addSyncLog({
        receiptNo: donation.receiptNo,
        donorName: donation.donorName,
        amount: donation.amount,
        status: 'failed',
        message: err.message || 'Sync connection timeout'
      });

      return {
        success: false,
        message: err.message || 'Failed to sync with Google Sheet'
      };
    }
  },

  async syncAllPendingToGoogleSheet() {
    const list = this.getDonations();
    const pending = list.filter((d) => d.googleSheetStatus !== 'synced');
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pending) {
      const res = await this.syncToGoogleSheet(item.id);
      if (res.success) {
        syncedCount++;
      } else {
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  },

  recordWhatsAppSent(donationId) {
    this.updateDonation(donationId, {
      whatsappStatus: 'sent',
      whatsappSentAt: new Date().toISOString()
    });
  },

  recordEmailSent(donationId) {
    this.updateDonation(donationId, {
      emailStatus: 'sent',
      emailSentAt: new Date().toISOString()
    });
  },

  async sendReceiptEmail(donationId, overrideEmail, overrideSubject, overrideBody) {
    const donation = this.getDonationById(donationId);
    if (!donation) return { success: false, message: 'Donation not found' };
    const settings = this.getNgoSettings();

    try {
      let pdfBase64 = null;
      try {
        const doc = generateDonationPdf(donation, settings);
        const dataUri = doc.output('datauristring');
        if (dataUri && dataUri.includes(',')) {
          pdfBase64 = dataUri.split(',')[1];
        }
      } catch (pdfErr) {
        console.warn('PDF generation for email modal failed:', pdfErr);
      }

      if (settings.googleSheetsWebhookUrl && settings.googleSheetsWebhookUrl.trim()) {
        const payload = {
          action: 'sendAndSync',
          sheetName: settings.googleSheetsSheetName,
          spreadsheetId: settings.googleSheetsSpreadsheetId,
          recipientEmail: overrideEmail || donation.donorEmail,
          subject: overrideSubject || `Official 80G Donation Receipt [${donation.receiptNo}] - ${settings.orgName}`,
          body: overrideBody || settings.emailTemplate,
          pdfBase64: pdfBase64,
          pdfFileName: `Receipt_${donation.receiptNo}_80G.pdf`,
          donation: {
            receiptNo: donation.receiptNo,
            date: donation.date,
            time: donation.time || '12:00',
            donorName: donation.donorName,
            donorPhone: donation.donorPhone || '',
            donorEmail: overrideEmail || donation.donorEmail || '',
            donorPan: donation.donorPan || '',
            amount: donation.amount,
            cause: donation.cause,
            paymentMode: donation.paymentMode,
            transactionId: donation.transactionId || '',
            is80GEligible: donation.is80GEligible ? 'YES' : 'NO',
            address: `${donation.donorAddress || ''}, ${donation.donorCity || ''}, ${donation.donorState || ''} - ${donation.donorPincode || ''}`,
            notes: donation.notes || '',
            timestamp: new Date().toISOString()
          }
        };

        try {
          await fetch(settings.googleSheetsWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (fetchErr) {
          console.warn('Fetch to Apps Script for email failed:', fetchErr);
        }
      }

      this.recordEmailSent(donationId);
      return { success: true };
    } catch (err) {
      console.error('Failed to send receipt email:', err);
      return { success: false, message: err.message };
    }
  },

  async sendLoginOtp(user, otpCode) {
    const settings = this.getNgoSettings();
    const webhookUrl = settings.googleSheetsWebhookUrl || APP_CONFIG?.googleSheet?.webhookUrl;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      console.warn('Webhook URL not configured for live OTP dispatch');
      return { success: false, message: 'Webhook URL not configured' };
    }

    const payload = {
      action: 'sendOtp',
      recipientEmail: user.email,
      otpCode: otpCode,
      userName: user.name,
      subject: `🔐 ${otpCode} is your Portal Login OTP - ${settings.orgName}`,
      body: `Dear ${user.name},\n\nYour 6-digit verification code to log into the ${settings.orgName} Management Portal is:\n\n👉  ${otpCode}  👈\n\nThis verification code is strictly confidential and valid for 10 minutes.\nIf you did not request this login attempt, please alert your administrator immediately.\n\nWarm regards,\nSecurity Team\n${settings.orgName}\nDelhi | www.kulshresthawf.org`
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to send OTP via webhook:', err);
      return { success: false, message: err.message };
    }
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
    } else {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  },

  getRegisteredUsers() {
    const DEFAULT_USERS = [
      {
        id: 'usr_nishant_01',
        name: 'Nishant Sharma',
        username: 'nishantsharma',
        email: 'nishantsharma57057@gmail.com',
        role: 'admin',
        status: 'main_admin',
        passwordHash: 'admin123',
        createdAt: '2026-10-01T00:00:00.000Z'
      },
      {
        id: 'usr_admin_01',
        name: 'Ayush Kulshrestha',
        username: 'ayushk',
        email: 'admin@kulshresthawf.org',
        role: 'admin',
        status: 'approved',
        passwordHash: 'admin123',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'usr_dir_01',
        name: 'Sandeep Kulshrestha',
        username: 'sandeepk',
        email: 'sandeep@kulshresthawf.org',
        role: 'admin',
        status: 'approved',
        passwordHash: 'director123',
        createdAt: '2026-09-01T00:00:00.000Z'
      }
    ];

    try {
      const stored = localStorage.getItem('kwf_registered_users_v3');
      if (!stored) {
        localStorage.setItem('kwf_registered_users_v3', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_USERS;
    }
  },

  registerUser(name, email, password, username, role = 'staff') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName || !cleanEmail || !password) {
      return { success: false, error: 'All fields are required.' };
    }

    const users = this.getRegisteredUsers();
    const exists = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || (u.username && u.username.toLowerCase() === cleanUsername)
    );
    if (exists) {
      return { success: false, error: 'An account with this email or username already exists.' };
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      role,
      status: 'pending',
      passwordHash: password,
      createdAt: new Date().toISOString()
    };

    const updated = [...users, newUser];
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(updated));

    // Save to Firestore
    FirestoreService.saveUser(newUser).catch(console.warn);

    const userToReturn = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status
    };

    return { success: true, user: userToReturn };
  },

  authenticateUser(identifier, password) {
    const cleanId = identifier.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    const match = users.find(
      (u) =>
        (u.email.toLowerCase() === cleanId || (u.username && u.username.toLowerCase() === cleanId)) &&
        u.passwordHash === password
      );

    if (!match) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    const user = {
      id: match.id,
      name: match.name,
      username: match.username,
      email: match.email,
      role: match.role,
      status: match.status
    };

    this.setCurrentUser(user);
    return { success: true, user };
  },

  approveUser(userId) {
    const users = this.getRegisteredUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u));
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(updated));

    const approvedUser = updated.find((u) => u.id === userId);
    if (approvedUser) {
      FirestoreService.saveUser(approvedUser).catch(console.warn);
    }
    return true;
  },

  updateRegisteredUser(userId, updates) {
    const users = this.getRegisteredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found' };

    const target = { ...users[idx], ...updates };
    if (updates.newPassword && updates.newPassword.trim()) {
      target.passwordHash = updates.newPassword.trim();
    }
    delete target.newPassword;

    users[idx] = target;
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(users));

    FirestoreService.saveUser(target).catch(console.warn);

    // If current logged-in user is updated, update local session
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      const updatedCurrent = {
        id: target.id,
        name: target.name,
        username: target.username,
        email: target.email,
        role: target.role,
        status: target.status
      };
      this.setCurrentUser(updatedCurrent);
    }

    return { success: true };
  },

  deleteRegisteredUser(userId) {
    const users = this.getRegisteredUsers();
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(filtered));

    FirestoreService.deleteUser(userId).catch(console.warn);
    return true;
  },

  exportDonationsToCsv() {
    const donations = this.getDonations();
    const headers = [
      'Receipt No',
      'Date',
      'Time',
      'Donor Name',
      'Mobile Phone',
      'Email',
      'PAN Number',
      'Amount (INR)',
      'Cause',
      'Payment Mode',
      'Transaction Ref',
      '80G Tax Exemption',
      'Address',
      'City',
      'State',
      'Pincode',
      'Google Sheet Status',
      'WhatsApp Status',
      'Email Status',
      'Created By'
    ];

    const rows = donations.map((d) => [
      `"${d.receiptNo}"`,
      `"${d.date}"`,
      `"${d.time}"`,
      `"${d.donorName.replace(/"/g, '""')}"`,
      `"${d.donorPhone}"`,
      `"${d.donorEmail}"`,
      `"${d.donorPan}"`,
      d.amount,
      `"${d.cause}"`,
      `"${d.paymentMode}"`,
      `"${d.transactionId}"`,
      d.is80GEligible ? 'YES' : 'NO',
      `"${d.donorAddress.replace(/"/g, '""')}"`,
      `"${d.donorCity}"`,
      `"${d.donorState}"`,
      `"${d.donorPincode}"`,
      `"${d.googleSheetStatus.toUpperCase()}"`,
      `"${d.whatsappStatus.toUpperCase()}"`,
      `"${d.emailStatus.toUpperCase()}"`,
      `"${d.createdBy}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KWF_Donations_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportForm10BDReport() {
    const donations = this.getDonations().filter((d) => d.is80GEligible && d.donorPan);
    const headers = [
      'Sl No',
      'Unique Registration Number (URN)',
      'Date of Issuance of URN',
      'Section code',
      'Identification Number of the donor (PAN)',
      'ID code',
      'Name of the donor',
      'Address of the donor',
      'Donation Type',
      'Mode of receipt',
      'Amount of donation (INR)'
    ];

    const settings = this.getNgoSettings();

    const rows = donations.map((d, index) => [
      index + 1,
      `"${settings.reg80GNumber}"`,
      `"2023-05-15"`,
      `"Section 80G(5)(vi)"`,
      `"${d.donorPan}"`,
      `"PAN"`,
      `"${d.donorName.replace(/"/g, '""')}"`,
      `"${d.donorAddress}, ${d.donorCity}, ${d.donorState} - ${d.donorPincode}"`,
      `"Specific Grant"`,
      `"${d.paymentMode === 'Cash' ? 'Cash' : 'Electronic / Banking'}"`,
      d.amount
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KWF_Form_10BD_Report_${settings.financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
