function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const contentLines = ['BT', '/F1 12 Tf', '50 760 Td'];

  lines.forEach((line, index) => {
    if (index === 0) {
      contentLines.push(`(${escapePdfText(line)}) Tj`);
      return;
    }

    contentLines.push('0 -18 Td');
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });

  contentLines.push('ET');

  const contentStream = contentLines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}\nendstream endobj`
  ];

  let output = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(output, 'utf8'));
    output += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(output, 'utf8');
  output += `xref\n0 ${objects.length + 1}\n`;
  output += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, 'utf8').toString('base64');
}

function buildSvgDataUrl({ title, subtitle, fields }) {
  const rows = fields
    .map((field, index) => {
      const y = 150 + index * 30;
      return `<text x="40" y="${y}" font-size="14" fill="#0f172a">${field.label}: ${String(field.value)}</text>`;
    })
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <rect width="900" height="600" fill="#f8fafc" />
      <rect x="24" y="24" width="852" height="552" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      <text x="40" y="72" font-size="30" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${String(title)}</text>
      <text x="40" y="104" font-size="16" font-family="Arial, sans-serif" fill="#475569">${String(subtitle)}</text>
      ${rows}
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

function buildReceiptArtifacts(title, summary, fields) {
  const pdfBase64 = buildSimplePdf([title, summary, ...fields.map((field) => `${field.label}: ${field.value}`)]);
  const imageDataUrl = buildSvgDataUrl({
    title,
    subtitle: summary,
    fields
  });

  return {
    pdfBase64,
    imageDataUrl,
    pdfDataUrl: `data:application/pdf;base64,${pdfBase64}`
  };
}

module.exports = {
  buildReceiptArtifacts
};
