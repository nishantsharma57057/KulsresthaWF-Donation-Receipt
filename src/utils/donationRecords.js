// Exact legacy demo fingerprints only. Never delete records from Firestore.
const legacyDemoRecords = [
  {
    "id": "don_101",
    "receiptNo": "KWF-202627-0101",
    "date": "2026-10-01",
    "donorName": "Vikramaditya Sharma",
    "amount": 11000,
    "transactionId": "UPI-261001-9876541"
  },
  {
    "id": "don_102",
    "receiptNo": "KWF-202627-0102",
    "date": "2026-10-01",
    "donorName": "Sunita Mehra",
    "amount": 5100,
    "transactionId": "UPI-261001-4458921"
  },
  {
    "id": "don_103",
    "receiptNo": "KWF-202627-0103",
    "date": "2026-09-30",
    "donorName": "Rajesh & Pooja Gupta",
    "amount": 25000,
    "transactionId": "HDFC-N30920268871"
  },
  {
    "id": "don_104",
    "receiptNo": "KWF-202627-0104",
    "date": "2026-09-29",
    "donorName": "Ananya Verma",
    "amount": 2100,
    "transactionId": "UPI-260929-3329910"
  },
  {
    "id": "don_105",
    "receiptNo": "KWF-202627-0105",
    "date": "2026-09-28",
    "donorName": "Manish Chawla",
    "amount": 51000,
    "transactionId": "CHQ-002819-SBI"
  }
];

export const isLegacyDemoDonation = (record) => legacyDemoRecords.some(
  (demo) => Object.keys(demo).every((key) => record?.[key] === demo[key])
);

export const filterDonationRecords = (records) => Array.isArray(records)
  ? records.filter((record) => record && !isLegacyDemoDonation(record))
  : [];
