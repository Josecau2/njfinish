const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { parseCatalogPDF } = require('./parseCatalogPDF'); // Optional PDF parser

const parseCatalogFile = (filePath, mimetype) => {
  return new Promise((resolve, reject) => {
    const data = [];

    const parseRow = (row) => {
      const rowData = {
        code: row['Item']?.trim() || row['Code']?.trim() || row['ITEM']?.trim() || row['CODE']?.trim() ||'',
        style: row['Style']?.trim() || row['STYLE']?.trim() || null,
        description: row['Description']?.trim() || row['DESCRIPTION']?.trim() || null,
        color: row['Color']?.trim() ||  row['COLOR']?.trim() || null,
        type: row['Type']?.trim() || row['TYPE']?.trim() || null,
        price: parseFloat(row['Price'] || row['PRICE']) || 0.0,
        discontinued:
          row['Discontinued']?.toLowerCase?.() === 'yes' ||
          row['Discontinued'] === '1' ||
          false,
      };

      // Only push rows that have at least a code
      if (rowData.code) {
        data.push(rowData);
      }
    };

    if (mimetype === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', parseRow)
        .on('end', () => resolve(data))
        .on('error', reject);

    } else if (
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/octet-stream' // optional fallback
    ) {
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);
        rows.forEach(parseRow);
        resolve(data);
      } catch (err) {
        reject(err);
      }

    } else if (mimetype === 'application/pdf') {
      // Optional: handle PDFs if your project uses them
      parseCatalogPDF(filePath)
        .then(resolve)
        .catch(reject);

    } else {
      reject(new Error('Unsupported file format for parsing.'));
    }
  });
};

module.exports = { parseCatalogFile };
