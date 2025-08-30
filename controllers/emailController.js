const nodemailer = require('nodemailer');
const { getPuppeteer } = require('../utils/puppeteerLauncher');

const PdfPrinter = require('pdfmake');
require('dotenv').config();

// Built-in fonts (no file dependency)
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
    },
};

const printer = new PdfPrinter(fonts);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use 587 if needed
    secure: true, // true for port 465, false for 587
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
    },
});


// // Send Proposal Email with PDF attachment
// exports.sendProposalEmail = async (req, res) => {
//     try {
//         const {
//             email,
//             body,
//             versions,
//             sendCopy,
//             proposalSummary,
//             stylesData,
//             priceSummary,
//             proposalItems,
//         } = req.body;


//         // Build PDF document definition
//         const docDefinition = {
//             content: [
//                 { text: 'Proposal Summary', style: 'header' },
//                 { text: `To: ${email}`, margin: [0, 5] },
//                 { text: `Versions: ${versions}`, margin: [0, 5] },
//                 { text: `Include Proposal Items: ${sendCopy ? 'Yes' : 'No'}`, margin: [0, 5] },

//                 { text: '\nProposal Details', style: 'subheader' },
//                 {
//                     ul: [
//                         `Description: ${proposalSummary.description}`,
//                         `Designer: ${proposalSummary.designer}`,
//                         `Customer: ${proposalSummary.customer}`,
//                         `Date: ${proposalSummary.date}`,
//                     ]
//                 },

//                 { text: '\nStyles', style: 'subheader' },
//                 ...stylesData.map(style => ({
//                     ul: [
//                         `Version: ${style.versionName}`,
//                         `Style: ${style.styleName}`,
//                         `Short Name: ${style.styleShortname}`,
//                         `Assembly Option: ${style.assemblyOption}`,
//                         `Image: ${style.image}`,  // Note: This will just print the URL unless you handle images in PDF
//                     ]
//                 })),

//                 { text: '\nPrice Summary', style: 'subheader' },
//                 {
//                     ul: [
//                         `Cabinets: $${priceSummary.cabinets}`,
//                         `Assembly Fee: $${priceSummary.assemblyFee}`,
//                         `Modifications: $${priceSummary.modifications}`,
//                         `Style Total: $${priceSummary.styleTotal}`,
//                         `Total: $${priceSummary.total}`,
//                         `Tax: $${priceSummary.tax}`,
//                         `Grand Total: $${priceSummary.grandTotal}`,
//                     ]
//                 },

//                 { text: '\nProposal Items', style: 'subheader' },
//                 {
//                     table: {
//                         headerRows: 1,
//                         widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
//                         body: [
//                             ['Qty', 'Item', 'Assembled', 'Hinge Side', 'Exposed Side', 'Price', 'Assembly Cost', 'Total'],
//                             ...proposalItems.map(item => [
//                                 item.qty,
//                                 item.item,
//                                 item.assembled,
//                                 item.hingeSide,
//                                 item.exposedSide,
//                                 `$${item.price.toFixed(2)}`,
//                                 `$${item.assemblyCost.toFixed(2)}`,
//                                 `$${item.total.toFixed(2)}`
//                             ])
//                         ],
//                     }
//                 }
//             ],
//             styles: {
//                 header: { fontSize: 18, bold: true },
//                 subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
//             },
//             defaultStyle: {
//                 font: 'Helvetica',
//             },
//         };


//         // Generate PDF in memory
//         const pdfDoc = printer.createPdfKitDocument(docDefinition);
//         const chunks = [];

//         pdfDoc.on('data', (chunk) => chunks.push(chunk));
//         pdfDoc.on('end', async () => {
//             const pdfBuffer = Buffer.concat(chunks);

//             // Send email with PDF attachment
//             await transporter.sendMail({
//                 from: process.env.GMAIL_USER,
//                 to: email,
//                 subject: 'Your Proposal',
//                 html: body,
//                 attachments: [
//                     {
//                         filename: 'Proposal.pdf',
//                         content: pdfBuffer,
//                     },
//                 ],
//             });

//             return res.status(200).json({ success: true, message: 'Email sent successfully' });
//         });

//         pdfDoc.end();

//     } catch (error) {
//         console.error('Error sending proposal email:', error);
//         return res.status(500).json({ success: false, error: 'Failed to send email' });
//     }
// };

exports.sendProposalEmail = async (req, res) => {
    try {
        const {
            email,
            body,
            versions,
            sendCopy,
            htmlContent, // New field for HTML content
        } = req.body;

    // Initialize Puppeteer (prefers system Chromium / puppeteer-core if available)
    const { puppeteer, launchOptions } = getPuppeteer();
    const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Set the HTML content
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
            },
            printBackground: true,
        });

        await browser.close();

        // Set up Nodemailer transporter
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.GMAIL_USER,
        //         pass: process.env.GMAIL_PASS,
        //     },
        // });

        // Send email with PDF attachment
        transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your Proposal',
            html: body,
            attachments: [
                {
                    filename: 'Proposal.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });

        return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending proposal email:', error);
        return res.status(500).json({ success: false, error: 'Failed to send email' });
    }
};