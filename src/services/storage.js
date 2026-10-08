import { filterDonationRecords } from '../utils/donationRecords';
import { numberToIndianWords } from '../utils/numberToWords';
import { FirestoreService } from './firestoreService';
import { buildDonationEmail } from '../utils/emailTemplate';
import { generateDonationPdf } from '../utils/receiptGenerator';
import { APP_CONFIG, NGO_PROFILE_REVISION, SENDER_PROFILE_REVISION, resolveNgoProfile } from '../config/appConfig';

const DONATIONS_KEY = 'kwf_donations_records_v1';
const SETTINGS_KEY = 'kwf_ngo_settings_v1';
const SYNC_LOGS_KEY = 'kwf_sheet_sync_logs_v1';
const AUTH_KEY = 'kwf_current_user_v1';

export const DEFAULT_SETTINGS = {
  ...APP_CONFIG.ngoProfile,
  ngoProfileRevision: NGO_PROFILE_REVISION,
  receiptPrefix: 'KWF',
  financialYear: '2026-27',
  googleSheetsWebhookUrl: '',
  googleSheetsSpreadsheetId: '',
  googleSheetsSheetName: 'Donations_2026_27',
  isGoogleSheetAutoSync: true,
  isAutoEmailReceipt: true,
  senderEmail: APP_CONFIG.email.fromEmail,
  senderProfileRevision: SENDER_PROFILE_REVISION,
  senderName: 'Kulshrestha Welfare Foundation',
  gmailAppScriptEnabled: true,
  customEmailWebhookUrl: '',
  whatsappSenderNumber: APP_CONFIG.whatsApp.businessPhone,
  whatsappTemplate: `Dear {DONOR_NAME},

Warm greetings from *Kulshrestha Welfare Foundation*! 🙏
We sincerely thank you for your generous donation of *₹{AMOUNT}* towards *{CAUSE}*.

🧾 *Receipt No:* {RECEIPT_NO}
📅 *Date:* {DATE}
💳 *Mode:* {PAYMENT_MODE} (Txn: {TXN_ID})

Download your donation receipt here:
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
Donor PAN: {DONOR_PAN}
------------------------------------------

Your donation receipt is attached.
Thank you for standing with underprivileged children and women in our society.

With sincere appreciation,
Kulshrestha Welfare Foundation
Registration No.: U8530DL2022NPL404259
B-323, G.D Colony, Myur Vihar Phase-3, New Delhi 110096
Mobile: 8826961430
Website: https://www.kulshresthawf.org
Email: info@kulshresthawf.org`
};

export const INITIAL_USER = {
  id: 'usr_admin_01',
  name: 'Ayush Kulshrestha',
  email: 'ayush@kulshresthawf.org',
  role: 'admin'
};


export const StorageService = {
  getDonations() {
    try {
      const data = localStorage.getItem(DONATIONS_KEY);
      return filterDonationRecords(data ? JSON.parse(data) : []);
    } catch {
      return [];
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
      const match = String(d.receiptNo || '').match(/(\d+)$/);
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

    const newDonation = {
      ...donationData,
      id,
      receiptNo,
      amountInWords,
      createdAt: now.toISOString(),
      googleSheetStatus: 'pending',
      emailStatus: 'pending',
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
    } else if (settings.isAutoEmailReceipt !== false && newDonation.donorEmail?.trim()) {
      // Email does not depend on whether automatic Sheets sync is enabled.
      setTimeout(() => {
        this.sendReceiptEmail(newDonation.id, undefined, undefined, undefined, false);
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
      ...updates,
      id: donations[idx].id,
      receiptNo: donations[idx].receiptNo
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

  async updateDonorDetails(id, details) {
    const original = this.getDonationById(id);
    if (!original) throw new Error('Donation not found');
    const allowed = ['donorName', 'donorPhone', 'donorEmail', 'donorPan', 'donorAddress', 'donorCity', 'donorState', 'donorPincode'];
    const changes = Object.fromEntries(allowed.map(key => [key, String(details[key] ?? original[key] ?? '').trim()]));
    changes.donorPan = changes.donorPan.toUpperCase();
    if (!changes.donorName || !changes.donorPhone) throw new Error('Donor name and phone are required.');
    if (changes.donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.donorEmail)) throw new Error('Enter a valid email address.');
    if (changes.donorPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(changes.donorPan)) throw new Error('Enter a valid PAN or leave it empty.');
    const amount = Number(details.amount ?? original.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100)) || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
      throw new Error('Enter a valid donation amount greater than zero, with up to two decimal places.');
    }
    const updated = {
      ...original, ...changes,
      amount,
      amountInWords: numberToIndianWords(amount),
      id: original.id, receiptNo: original.receiptNo,
      donorDetailsUpdatedAt: new Date().toISOString(),
      googleSheetStatus: 'pending'
    };
    // Confirm persistence before reporting a successful edit. Do not issue a new receipt or send messages.
    await FirestoreService.saveDonation(updated);
    const latest = this.getDonations();
    const index = latest.findIndex(record => record.id === original.id);
    if (index >= 0) latest[index] = updated;
    else latest.unshift(updated);
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(latest));
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
            const merged = { ...base, ...parsed };
      if (parsed.senderProfileRevision !== SENDER_PROFILE_REVISION) {
        merged.googleSheetsWebhookUrl = fallbackUrl;
        merged.senderEmail = APP_CONFIG.email.fromEmail;
        merged.whatsappSenderNumber = APP_CONFIG.whatsApp.businessPhone;
        merged.senderProfileRevision = SENDER_PROFILE_REVISION;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      }
      if (merged.googleSheetsSpreadsheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms') merged.googleSheetsSpreadsheetId = '';
      if (parsed.ngoProfileRevision !== NGO_PROFILE_REVISION) {
        const migrated = resolveNgoProfile({ ...merged, ngoProfileRevision: parsed.ngoProfileRevision });
        migrated.emailTemplate = DEFAULT_SETTINGS.emailTemplate;
        migrated.whatsappTemplate = DEFAULT_SETTINGS.whatsappTemplate;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return merged;
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
      if (!settings.googleSheetsWebhookUrl?.trim()) throw new Error('Google Sheets webhook is not configured.');
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
        const emailContent = buildDonationEmail(donation, settings);
        const payload = {
          subject: emailContent.subject,
          body: emailContent.text,
          htmlBody: emailContent.html,
          inlineImages: emailContent.inlineImages,
          action: 'appendDonation',
          sendEmail: settings.isAutoEmailReceipt !== false,
          syncToSheet: true,
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

        await fetch(settings.googleSheetsWebhookUrl, {
            method: 'POST',
            mode: 'no-cors', // standard for Google Apps Script web apps
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

      }

      // An opaque no-cors response cannot confirm a Sheets write.
      const now = new Date().toISOString();
      const updated = this.updateDonation(donationId, {
        googleSheetStatus: 'requested',
        googleSheetRequestedAt: now,
        ...(settings.isAutoEmailReceipt !== false && donation.donorEmail?.trim()
          ? { emailStatus: 'queued', emailRequestedAt: now } : {})
      });

      this.addSyncLog({
        receiptNo: updated.receiptNo,
        donorName: updated.donorName,
        amount: updated.amount,
        status: 'requested',
        message: `Sync request submitted for Google Sheet [${settings.googleSheetsSheetName}]; confirmation pending`
      });

      return {
        success: true,
        message: `Sync request submitted for receipt ${donation.receiptNo}; confirmation pending`
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

  async sendReceiptEmail(donationId, overrideEmail, overrideSubject, overrideBody, syncToSheet = true) {
    const donation = this.getDonationById(donationId);
    if (!donation) return { success: false, message: 'Donation not found' };
    const settings = this.getNgoSettings();
    const emailContent = buildDonationEmail(donation, settings, overrideBody);
    if (!settings.googleSheetsWebhookUrl?.trim()) return { success: false, message: 'Email webhook is not configured.' };

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
          sendEmail: true,
          syncToSheet,
          sheetName: settings.googleSheetsSheetName,
          spreadsheetId: settings.googleSheetsSpreadsheetId,
          recipientEmail: overrideEmail || donation.donorEmail,
          subject: overrideSubject || emailContent.subject,
          body: emailContent.text,
          htmlBody: emailContent.html,
          inlineImages: emailContent.inlineImages,
          pdfBase64: pdfBase64,
          pdfFileName: `Receipt_${donation.receiptNo}.pdf`,
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
          throw fetchErr;
        }
      }

      this.updateDonation(donationId, { emailStatus: 'queued', emailRequestedAt: new Date().toISOString() });
      return { success: true };
    } catch (err) {
      console.error('Failed to send receipt email:', err);
      this.updateDonation(donationId, { emailStatus: 'failed', emailError: err.message });
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
      const session = JSON.parse(stored);
      const account = this.getRegisteredUsers().find(u => u.id === session?.id);
      if (!account || !['approved', 'main_admin'].includes(account.status)) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      const { id, name, username, email, role, status } = account;
      return { id, name, username, email, role, status };
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
    } else {
      const account = this.getRegisteredUsers().find(u => u.id === user.id);
      if (!account || !['approved', 'main_admin'].includes(account.status)) {
        localStorage.removeItem(AUTH_KEY);
        return false;
      }
      const { id, name, username, email, role, status } = account;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ id, name, username, email, role, status }));
      return true;
    }
  },

  async refreshRegisteredUsers() {
    const remote = await FirestoreService.getUsers();
    const merged = new Map(this.getRegisteredUsers().map(user => [user.id, user]));
    remote.forEach(user => merged.set(user.id, user));
    const users = [...merged.values()];
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(users));
    return users;
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

  async registerUser(name, email, password, username, role = 'staff') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanName || !cleanEmail || !password) {
      return { success: false, error: 'All fields are required.' };
    }

    const users = await this.refreshRegisteredUsers();
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
      role: 'staff',
      status: 'pending',
      passwordHash: password,
      createdAt: new Date().toISOString()
    };

    await FirestoreService.saveUser(newUser);
    const updated = [...users, newUser];
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(updated));

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

  async authenticateUser(identifier, password) {
    const cleanId = identifier.trim().toLowerCase();
    const users = await this.refreshRegisteredUsers();
    const match = users.find(
      (u) =>
        (u.email.toLowerCase() === cleanId || (u.username && u.username.toLowerCase() === cleanId)) &&
        u.passwordHash === password
      );

    if (!match) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    if (!['approved', 'main_admin'].includes(match.status)) {
      this.setCurrentUser(null);
      return { success: false, error: match.status === 'pending'
        ? 'Your account is pending administrator approval. You can sign in once approved.'
        : 'Your account does not have access. Please contact your administrator.' };
    }

    const user = {
      id: match.id,
      name: match.name,
      username: match.username,
      email: match.email,
      role: match.role,
      status: match.status
    };

    return { success: true, user };
  },

  async approveUser(userId) {
    const actor = this.getCurrentUser();
    if (!actor || actor.role !== 'admin' || !['approved', 'main_admin'].includes(actor.status)) {
      throw new Error('Only an approved administrator can manage account access.');
    }
    const users = await this.refreshRegisteredUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u));
    const approvedUser = updated.find((u) => u.id === userId);
    if (!approvedUser) throw new Error('User not found.');
    await FirestoreService.saveUser(approvedUser);
    localStorage.setItem('kwf_registered_users_v3', JSON.stringify(updated));
    return true;
  },

  updateRegisteredUser(userId, updates) {
    const actor = this.getCurrentUser();
    if (!actor || actor.role !== 'admin' || !['approved', 'main_admin'].includes(actor.status)) {
      throw new Error('Only an approved administrator can manage account access.');
    }
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
    const actor = this.getCurrentUser();
    if (!actor || actor.role !== 'admin' || !['approved', 'main_admin'].includes(actor.status)) {
      throw new Error('Only an approved administrator can manage account access.');
    }
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
      `""`,
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
