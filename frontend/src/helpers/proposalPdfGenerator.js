import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generateProposalPdfBlob = (formData, selectedVersionData, priceSummary) => {
    // Build your content using the same logic from PrintProposalModal
    const content = [
        { text: 'NJ Cabinets', style: 'header' },
        { text: `Dear ${formData?.customerName || 'Customer'},\nHere is your design and pricing info:\n`, margin: [0, 10, 0, 20] },
        {
            table: {
                headerRows: 1,
                widths: ['*', '*', '*', '*'],
                body: [
                    ['Description', 'Designer', 'Customer', 'Date'],
                    [formData?.description || '', 'Test Cont', formData?.customerName || '', new Date().toLocaleDateString('en-US')],
                ],
            },
            margin: [0, 0, 0, 20],
        },
    { text: 'Quote Items', style: 'subheader' },
        {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                    ['No.', 'Qty', 'Item', 'Assembled', 'Hinge side', 'Exposed side', 'Price', 'Assembly cost', 'Total'],
                    ...(selectedVersionData || []).map((item, index) => [
                        `${index + 1}.`,
                        item.qty,
                        item.code || '',
                        'Yes',
                        '-',
                        '-',
                        `$${parseFloat(item.price || 0).toFixed(2)}`,
                        `$${parseFloat(item.assemblyFee || 0).toFixed(2)}`,
                        `$${parseFloat(item.total || 0).toFixed(2)}`
                    ])
                ]
            },
            layout: 'lightHorizontalLines',
        },
        { text: 'Price Summary', style: 'subheader', margin: [0, 20, 0, 10] },
        {
            table: {
                widths: ['*', 'auto'],
                body: [
                    ['Cabinets & Parts:', `$${(priceSummary?.cabinets ?? 0).toFixed(2)}`],
                    ['Assembly fee:', `$${(priceSummary?.assemblyFee ?? 0).toFixed(2)}`],
                    ['Modifications:', `$${(priceSummary?.modifications ?? 0).toFixed(2)}`],
                    ['Style Total:', `$${(priceSummary?.styleTotal ?? 0).toFixed(2)}`],
                    ['Total:', `$${(priceSummary?.total ?? 0).toFixed(2)}`],
                    ['Tax:', `$${(priceSummary?.tax ?? 0).toFixed(2)}`],
                    ['Grand Total:', `$${(priceSummary?.grandTotal ?? 0).toFixed(2)}`],

                ],
            },
        },
    ];

    const docDefinition = { content };

    return new Promise((resolve, reject) => {
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate PDF'));
        });
    });
};
