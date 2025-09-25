#!/usr/bin/env node
// Generate proposal HTML via the shared builder to ensure the frontend can build the PDF HTML.
// Writes HTML to frontend/tmp/proposal_test.html and prints basic stats.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve project root and helper path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const helperPath = path.resolve(__dirname, '../src/helpers/proposalPdfBuilder.js');

// Dynamically import the ESM export from a .js file under Vite context
const mod = await import(pathToFileURL(helperPath).href);
const { buildProposalPdfHtml } = mod;

// Minimal sample data similar to Email/Print flows
const sample = {
  formData: {
    description: 'Kitchen Project – Sample',
    customerName: 'Jane Doe',
    date: new Date().toISOString(),
    manufacturersData: [
      {
        items: [
          {
            qty: 2,
            code: 'W0930',
            price: 125,
            assemblyFee: 20,
            total: 145,
            isRowAssembled: true,
            hingeSide: 'L',
            exposedSide: 'R',
            description: 'Wall cabinet 9x30',
            modifications: [
              { name: 'Drill shelf pegs', price: 5, qty: 2 },
            ],
          },
        ],
        summary: {
          cabinets: 250,
          assemblyFee: 40,
          modificationsCost: 10,
          styleTotal: 300,
          total: 300,
          tax: 24,
          grandTotal: 324,
        },
      },
    ],
    selectedCatalog: [
      { itemName: 'Handle A', quantity: 10, unitPrice: 3.25 },
    ],
  },
  options: {
    selectedColumns: ['no', 'qty', 'item', 'assembled', 'hingeSide', 'exposedSide', 'price', 'assemblyCost', 'total'],
    showProposalItems: true,
    showPriceSummary: true,
    selectedVersions: [],
    includeCatalog: true,
  },
  pdfCustomization: {
    companyName: 'NJ Cabinets',
    companyEmail: 'sales@example.com',
    companyPhone: '(555) 123-4567',
    headerBgColor: '#0d6efd',
  },
};

const html = buildProposalPdfHtml(sample);

const outDir = path.resolve(__dirname, '../tmp');
const outFile = path.join(outDir, 'proposal_test.html');
await fs.promises.mkdir(outDir, { recursive: true });
await fs.promises.writeFile(outFile, html, 'utf8');

console.log(JSON.stringify({ success: true, file: outFile, htmlLength: html.length }, null, 2));
