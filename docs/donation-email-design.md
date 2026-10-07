# Enable the receipt-style email

The web app sends plain text, HTML and embedded logo/signature images. Gmail uses the design only after the Apps Script deployment accepts these fields.

1. Open the Google Sheet connected to this app, then Extensions → Apps Script.
2. Replace the existing doPost script with scripts/donation-email-apps-script.gs from this repository.
3. Save. Select Deploy → Manage deployments → Edit (pencil).
4. Choose New version, then Deploy. Keep the existing Web App deployment URL.
5. In the app, open a donation → Send email. Review the design preview and send a test to your own address.

No test email was sent automatically. The preview uses the same HTML as the webhook payload. Email clients may use Arial when Montserrat/Poppins are unavailable. Opening an external mail client uses the plain-text version; attach the receipt PDF manually.

For the organization email/WhatsApp sender and required account setup, see [sender-setup.md](sender-setup.md).
