const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const { Transform } = require('stream');

/**
 * Chunked CSV/Excel parser for large catalog files
 * Processes files in batches to avoid memory issues
 */
class ChunkedCatalogParser {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000; // Process 1000 rows at a time
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB limit
    this.onChunk = options.onChunk || (() => {}); // Callback for each chunk
    this.onProgress = options.onProgress || (() => {}); // Progress callback
  }

  /**
   * Parse CSV file in chunks
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const stats = fs.statSync(filePath);
      
      if (stats.size > this.maxFileSize) {
        return reject(new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`));
      }

      let currentChunk = [];
      let totalProcessed = 0;
      let totalRows = 0;

      // First pass: count total rows for progress tracking
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', () => totalRows++)
        .on('end', () => {
          // Second pass: process in chunks
          this.processCSVInChunks(filePath, totalRows)
            .then(resolve)
            .catch(reject);
        })
        .on('error', reject);
    });
  }

  /**
   * Process CSV file in chunks
   */
  async processCSVInChunks(filePath, totalRows) {
    return new Promise((resolve, reject) => {
      let currentChunk = [];
      let totalProcessed = 0;
      const allData = [];

      const processChunk = async (chunk) => {
        try {
          await this.onChunk(chunk, totalProcessed, totalRows);
          allData.push(...chunk);
          totalProcessed += chunk.length;
          this.onProgress(totalProcessed, totalRows);
        } catch (error) {
          throw error;
        }
      };

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          const rowData = this.parseRow(row);
          if (rowData.code) {
            currentChunk.push(rowData);
            
            if (currentChunk.length >= this.chunkSize) {
              try {
                await processChunk(currentChunk);
                currentChunk = [];
              } catch (error) {
                return reject(error);
              }
            }
          }
        })
        .on('end', async () => {
          try {
            // Process remaining rows
            if (currentChunk.length > 0) {
              await processChunk(currentChunk);
            }
            resolve(allData);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file in chunks
   */
  async parseExcel(filePath) {
    const stats = fs.statSync(filePath);
    
    if (stats.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      // Build array of row objects based on header row
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber] || `COL_${colNumber}`;
          obj[key] = (cell.value && cell.value.text) ? String(cell.value.text) : String(cell.value ?? '');
        });
        rows.push(obj);
      });

      const allData = [];
      let totalProcessed = 0;
      const totalRows = rows.length;

      for (let i = 0; i < rows.length; i += this.chunkSize) {
        const chunk = rows.slice(i, i + this.chunkSize)
          .map(row => this.parseRow(row))
          .filter(row => row.code);

        if (chunk.length > 0) {
          await this.onChunk(chunk, totalProcessed, totalRows);
          allData.push(...chunk);
          totalProcessed += chunk.length;
          this.onProgress(totalProcessed, totalRows);
        }
      }

      return allData;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Parse a single row
   */
  parseRow(row) {
    return {
      code: row['Item']?.trim() || row['Code']?.trim() || row['ITEM']?.trim() || row['CODE']?.trim() || '',
      style: row['Style']?.trim() || row['STYLE']?.trim() || null,
      description: row['Description']?.trim() || row['DESCRIPTION']?.trim() || null,
      color: row['Color']?.trim() || row['COLOR']?.trim() || null,
      type: row['Type']?.trim() || row['TYPE']?.trim() || null,
      price: parseFloat(row['Price'] || row['PRICE']) || 0.0,
      discontinued:
        row['Discontinued']?.toLowerCase?.() === 'yes' ||
        row['Discontinued'] === '1' ||
        false,
    };
  }

  /**
   * Main parsing function
   */
  async parse(filePath, mimetype) {
    if (mimetype === 'text/csv') {
      return this.parseCSV(filePath);
    } else if (
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/octet-stream'
    ) {
      return this.parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format for chunked parsing.');
    }
  }
}

/**
 * Helper function for backward compatibility
 */
const parseChunkedCatalogFile = async (filePath, mimetype, options = {}) => {
  const parser = new ChunkedCatalogParser(options);
  return parser.parse(filePath, mimetype);
};

module.exports = { 
  ChunkedCatalogParser,
  parseChunkedCatalogFile
};
