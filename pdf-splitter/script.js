pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let zipData = null;
let originalFileName = '';
let selectedFormat = 'pdf';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processing = document.getElementById('processing');
const processingText = document.getElementById('processingText');
const result = document.getElementById('result');
const error = document.getElementById('error');
const resultMessage = document.getElementById('resultMessage');
const errorMessage = document.getElementById('errorMessage');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelector = document.getElementById('formatSelector');

// File upload handlers
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', downloadZip);

function selectFormat(format) {
    selectedFormat = format;
    document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.closest('.format-option').classList.add('selected');
    document.getElementById('format' + format.charAt(0).toUpperCase() + format.slice(1)).checked = true;
}

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
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showError('Please select a PDF file.');
        return;
    }

    originalFileName = file.name.replace(/\.pdf$/i, '');

    hideAllStates();
    processing.style.display = 'block';
    processingText.textContent = 'Processing your PDF...';

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (selectedFormat === 'pdf') {
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            if (totalPages <= 1) {
                showError('The PDF has only one page. No splitting is needed.');
                return;
            }

            await splitPDF(pdfDoc, totalPages);
        } else {
            await splitPDFAsImages(arrayBuffer, selectedFormat);
        }

    } catch (err) {
        console.error('Error processing PDF:', err);
        showError('Error processing the PDF file. Please make sure it\'s a valid PDF.');
    }
}

async function splitPDF(pdfDoc, totalPages) {
    try {
        const zip = new JSZip();
        
        for (let i = 0; i < totalPages; i++) {
            processingText.textContent = `Processing page ${i + 1} of ${totalPages}...`;
            
            const newPdf = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);
            
            const pdfBytes = await newPdf.save();
            const fileName = `${originalFileName}_p${i + 1}.pdf`;
            zip.file(fileName, pdfBytes);
        }

        zipData = await zip.generateAsync({ type: 'blob' });
        showResult(totalPages, 'PDF');

    } catch (err) {
        console.error('Error splitting PDF:', err);
        showError('Error splitting the PDF file. Please try again.');
    }
}

async function splitPDFAsImages(arrayBuffer, format) {
    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        if (totalPages <= 1) {
            showError('The PDF has only one page. No splitting is needed.');
            return;
        }

        const zip = new JSZip();
        
        for (let i = 1; i <= totalPages; i++) {
            processingText.textContent = `Converting page ${i} of ${totalPages} to ${format.toUpperCase()}...`;
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, `image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);
            });
            
            const fileName = `${originalFileName}_p${i}.${format}`;
            zip.file(fileName, blob);
        }

        zipData = await zip.generateAsync({ type: 'blob' });
        showResult(totalPages, format.toUpperCase());

    } catch (err) {
        console.error('Error converting PDF to images:', err);
        showError('Error converting the PDF to images. Please try again.');
    }
}

function showResult(totalPages, formatType) {
    hideAllStates();
    result.style.display = 'block';
    resultMessage.textContent = `Successfully split into ${totalPages} individual ${formatType} files.`;
}

function showError(message) {
    hideAllStates();
    error.style.display = 'block';
    errorMessage.textContent = message;
}

function hideAllStates() {
    uploadArea.style.display = 'none';
    formatSelector.style.display = 'none';
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
    formatSelector.style.display = 'block';
    fileInput.value = '';
    zipData = null;
    originalFileName = '';
}