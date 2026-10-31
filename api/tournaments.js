import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export default async function handler(req, res) {
  try {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['TOUR'];
    if (!sheet) {
      return res.status(500).json({
        error: 'Không tìm thấy sheet TOUR',
        availableSheets: Object.keys(doc.sheetsByTitle),
      });
    }

    const rows = await sheet.getRows();

    const data = rows
      .map(r => ({
        name: String(r.get('TOUR') || '').trim(),
        buyin: Number(r.get('BUYIN')) || 0,
        stack: String(r.get('STACK') || '').trim(),
        blind: String(r.get('BLIND') || '').trim(),
        start: Number(r.get('START OFF LEVEL')) || 0,
      }))
      .filter(x => x.name && x.buyin > 0);

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}