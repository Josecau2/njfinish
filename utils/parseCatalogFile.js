const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
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
      // Use exceljs to read spreadsheet safely
      const workbook = new ExcelJS.Workbook();
      workbook.xlsx.readFile(filePath)
        .then(() => {
          const worksheet = workbook.worksheets[0];
          if (!worksheet) return resolve(data);
          // Assume first row is header
          const headers = [];
          worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim();
          });
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const obj = {};
            row.eachCell((cell, colNumber) => {
              const key = headers[colNumber] || `COL_${colNumber}`;
              obj[key] = (cell.value && cell.value.text) ? String(cell.value.text) : String(cell.value ?? '');
            });
            parseRow(obj);
          });
          resolve(data);
        })
        .catch(reject);

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
