let zipData = null;
let originalFileName = '';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processing = document.getElementById('processing');
const result = document.getElementById('result');
const error = document.getElementById('error');
const resultMessage = document.getElementById('resultMessage');
const errorMessage = document.getElementById('errorMessage');
const downloadBtn = document.getElementById('downloadBtn');

// File upload handlers
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', downloadZip);

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

async function processFile(file) {
    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showError('Please select a PDF file.');
        return;
    }

    // Store original file name (without extension)
    originalFileName = file.name.replace(/\.pdf$/i, '');

    // Show processing state
    hideAllStates();
    processing.style.display = 'block';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();

        if (totalPages <= 1) {
            showError('The PDF has only one page. No splitting is needed.');
            return;
        }

        await splitPDF(pdfDoc, totalPages);

    } catch (err) {
        console.error('Error processing PDF:', err);
        showError('Error processing the PDF file. Please make sure it\'s a valid PDF.');
    }
}

async function splitPDF(pdfDoc, totalPages) {
    try {
        const zip = new JSZip();
        
        for (let i = 0; i < totalPages; i++) {
            // Create a new PDF document for each page
            const newPdf = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            
            // Generate PDF bytes
            const pdfBytes = await newPdf.save();
            
            // Add to zip with proper naming
            const fileName = `${originalFileName}_p${i + 1}.pdf`;
            zip.file(fileName, pdfBytes);
        }

        // Generate zip file
        zipData = await zip.generateAsync({ type: 'blob' });
        
        showResult(totalPages);

    } catch (err) {
        console.error('Error splitting PDF:', err);
        showError('Error splitting the PDF file. Please try again.');
    }
}

function showResult(totalPages) {
    hideAllStates();
    result.style.display = 'block';
    resultMessage.textContent = `Successfully split into ${totalPages} individual PDF files.`;
}

function showError(message) {
    hideAllStates();
    error.style.display = 'block';
    errorMessage.textContent = message;
}

function hideAllStates() {
    uploadArea.style.display = 'none';
    processing.style.display = 'none';
    result.style.display = 'none';
    error.style.display = 'none';
}

function downloadZip() {
    if (zipData) {
        const url = URL.createObjectURL(zipData);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFileName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function resetApp() {
    hideAllStates();
    uploadArea.style.display = 'block';
    fileInput.value = '';
    zipData = null;
    originalFileName = '';
}