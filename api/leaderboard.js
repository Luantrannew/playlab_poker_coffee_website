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

    const sheet = doc.sheetsByTitle['KHÁCH MỚI'];
    if (!sheet) {
      return res.status(500).json({
        error: 'Không tìm thấy sheet KHÁCH MỚI',
        availableSheets: Object.keys(doc.sheetsByTitle),
      });
    }

    const rows = await sheet.getRows();

    const data = rows
      .map(r => ({
        id: String(r.get('4 SĐ') || '').trim(),
        name: String(r.get('TÊN KHÁCH') || '').trim(),
        elo: Number(r.get('ĐIỂM ELO')) || 0,
        exchanged: Number(r.get('ĐIỂM ĐỔI')) || 0,
        tickets: 0,
        hands: 0,
      }))
      .filter(x => x.id && x.name);

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}