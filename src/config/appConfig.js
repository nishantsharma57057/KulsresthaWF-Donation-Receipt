/**
 * ==============================================================================
 * KULSHRESTHA WELFARE FOUNDATION - MASTER APPLICATION CONFIGURATION
 * ==============================================================================
 * All primary credentials, API links, Google Sheets webhooks, and default NGO
 * details are centralized in this single file.
 * 
 * In the future, if you change your Google Sheet, email provider, or admin details,
 * you can edit this single file without touching any complex component codeeeee!
 * ==============================================================================
 */

export const APP_CONFIG = {
  // 1. APPLICATION BRAND & VERSION
  appName: 'Kulshrestha Welfare Foundation - 80G Receipt Portal',
  appVersion: '2.1.0',
  environment: 'production',

  // 2. DEFAULT MAIN ADMINISTRATOR CREDENTIALS
  // You can use either of these to log in
  defaultAdmin: {
    name: 'Nishant Sharma',
    username: 'nishantsharma',
    email: 'nishantsharma57057@gmail.com',
    initialPassword: 'admin123', // You can change this in the User Access view anytime
    role: 'admin'
  },

  // 3. GOOGLE SHEETS AUTOMATIC SYNC WEBHOOK
  // Replace this URL whenever you deploy a new Google Apps Script Web App!
  googleSheet: {
    // Current active Google Apps Script Web App Endpoint
    webhookUrl: 'https://script.google.com/macros/s/AKfycbzZtwZ1sFaI3-rcDTBDpnSafg5TZNVTiquF3czUUBawqb7xTX53g0QOEA5UHM6Rl5m2Tg/exec',
    spreadsheetName: 'Donations_2026_27',
    sheetTabName: 'Donations_2026_27',
    autoSyncEnabled: true,
    syncIntervalSeconds: 30
  },

  // 4. EMAIL SERVICE & OTP CONFIGURATION
  email: {
    provider: 'apps_script', // 'apps_script' | 'resend' | 'sendgrid' | 'smtp'
    fromName: 'Kulshrestha Welfare Foundation',
    fromEmail: 'info@kulshresthawf.org',
    replyTo: 'nishantsharma57057@gmail.com',
    // 2-Factor Authentication (OTP on email during login)
    enableLoginEmailOtp: true,
    otpExpirationMinutes: 10,
    showOtpOnScreen: true // Set to false whenever you want to hide OTP on login screen
  },

  // 5. WHATSAPP GATEWAY CREDENTIALS (WATI / Interakt / Gupshup)
  whatsApp: {
    provider: 'direct_api',
    businessPhone: '8826961430',
    templateName: 'kwf_80g_receipt_ack_v1'
  },

  // 6. DEFAULT NGO LEGAL & REGISTRATION PROFILE
  ngoProfile: {
    "orgName": "Kulshrestha Welfare Foundation",
    "tagline": "Care · Dignity · Opportunity · Impact",
    "cin": "U8530DL2022NPL404259",
    "pan": "AAJCK7754K",
    "reg80GNumber": "",
    "reg12ANumber": "",
    "section80GClause": "",
    "address": "B-323, G.D Colony, Myur Vihar Phase-3",
    "city": "New Delhi",
    "state": "",
    "pincode": "110096",
    "phone": "8826961430",
    "email": "info@kulshresthawf.org",
    "website": "www.kulshresthawf.org",
    "signatoryName": "Ayush Kulshrestha",
    "signatoryTitle": "Trustee"
},

  // 7. FIREBASE CLOUD DATABASE REFERENCE
  firebase: {
    projectId: 'autonomous-button-82sm5',
    firestoreDatabaseId: 'ai-studio-kulshresthawelfa-6220805e-731e-4b00-a8d7-37237cbb35ae',
    configPath: './firebase-applet-config.json'
  },

  // 8. DASHBOARD UI MENU VISIBILITY SETTINGS
  ui: {
    // Set to false to hide Settings from the sidebar menu
    showSettingsInSidebar: false,
    // Set to false to hide User Access from the sidebar menu
    showUserAccessInSidebar: true
  }
};

export const NGO_PROFILE_REVISION = 'verified-profile-2026-10-07';

export function resolveNgoProfile(settings = {}) {
  if (settings.ngoProfileRevision === NGO_PROFILE_REVISION) return settings;
  return { ...settings, ...APP_CONFIG.ngoProfile, ngoProfileRevision: NGO_PROFILE_REVISION };
}
