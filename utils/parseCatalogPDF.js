const fs = require('fs');
const pdfParse = require('pdf-parse');

const parseCatalogPDF = async (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

    const data = [];
    const headers = lines[0].split(/\s{2,}/);

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/\s{2,}/);
        if (cols.length < 3) continue;

        const [Code, Description, ...prices] = cols;

        const row = {
            code: Code,
            description: Description
        };

        for (let j = 2; j < headers.length; j++) {
            const state = headers[j];
            const price = parseFloat(prices[j - 2]?.replace('$', '')) || null;
            row[state] = price;
        }

        data.push(row);
    }

    return data;
};

module.exports = { parseCatalogPDF };
