try {
  console.log("Testing pdf-parse load...");
  const pdf = require('pdf-parse');
  console.log("Keys:", Object.keys(pdf));
  console.log("Type of pdf:", typeof pdf);
  if (pdf.PDFParse) {
    console.log("PDFParse class found.");
  }
  if (pdf.default) {
    console.log("Default export found. Keys:", Object.keys(pdf.default));
  }
} catch (e) {
  console.error("CRITICAL ERROR LOADING LIBRARY:");
  console.error(e);
}
