let stream;
let capturedPhotos = [];
let selectedPhotos = [];
let selectedTemplate = 0;

// const templates = [
//     {
//         src: 'tmp1.png',
//         positions: [
//             { top: '10%', left: '10%', width: '35%', height: '35%' },
//             { top: '10%', right: '10%', width: '35%', height: '35%' },
//             { bottom: '10%', left: '10%', width: '35%', height: '35%' },
//             { bottom: '10%', right: '10%', width: '35%', height: '35%' }
//         ]
//     },
//     {
//         src: 'tmp2.png',
//         positions: [
//             { top: '10%', left: '10%', width: '35%', height: '35%' },
//             { top: '10%', right: '10%', width: '35%', height: '35%' },
//             { bottom: '10%', left: '10%', width: '35%', height: '35%' },
//             { bottom: '10%', right: '10%', width: '35%', height: '35%' }
//         ]
//     }
// ];

const templates = [
    {
        src: '/assets/images/tmp1.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp2.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp3.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp4.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp5.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp6.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp7.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    },
    {
        src: '/assets/images/tmp8.png',
        positions: [
            { top: '28%', left: '8%', width: '40%', height: '26%' },
            { top: '28%', right: '7.6%', width: '40%', height: '26%' },
            { bottom: '16.5%', left: '8%', width: '40%', height: '26%' },
            { bottom: '16.5%', right: '7.6%', width: '40%', height: '26%' }
        ]
    }
];


// Add this function to load and convert images
function loadTemplateImages() {
    const templateFiles = ['tmp1.png', 'tmp2.png'];
    
    templateFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            templates[index].src = canvas.toDataURL('image/png');
            
            // Update template preview
            const templateEl = document.querySelectorAll('.template')[index];
            templateEl.style.backgroundImage = `url('${templates[index].src}')`;
        };
        img.src = file;
    });
}

async function initCamera() {
    try {
        const aspectRatio = 445/289;
        const constraints = {
            video: {
                width: { ideal: 445 * 2 },
                height: { ideal: 289 * 2 },
                aspectRatio: aspectRatio
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('camera-feed');
        videoElement.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}

// Update the takePicture function to maintain aspect ratio
function takePicture() {
    const video = document.getElementById('camera-feed');
    const canvas = document.createElement('canvas');
    
    // Set canvas size to match the desired aspect ratio (445:289)
    const aspectRatio = 445/289;
    canvas.width = 445 * 2; // multiply by 2 for better quality
    canvas.height = 289 * 2;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions to maintain aspect ratio
    let drawWidth = video.videoWidth;
    let drawHeight = video.videoHeight;
    let startX = 0;
    let startY = 0;
    
    const videoAspect = video.videoWidth / video.videoHeight;
    
    if (videoAspect > aspectRatio) {
        // Video is wider than needed
        drawWidth = video.videoHeight * aspectRatio;
        startX = (video.videoWidth - drawWidth) / 2;
    } else {
        // Video is taller than needed
        drawHeight = video.videoWidth / aspectRatio;
        startY = (video.videoHeight - drawHeight) / 2;
    }
    
    // Draw the cropped image
    ctx.drawImage(video, 
        startX, startY, drawWidth, drawHeight,
        0, 0, canvas.width, canvas.height
    );
    
    const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    if (capturedPhotos.length < 8) {
        capturedPhotos.push(photoUrl);
        updateCapturedPhotosGrid();
        showSuccess('Photo captured successfully!');
    } else {
        // alert('Maximum 8 photos allowed!');
        showDialog(
            'Maximum Photos Reached',
            'You can only capture up to 8 photos. Please delete some photos to capture more.',
            dialogTypes.WARNING
        );
    }
}

// Update the CSS for photo thumbnails to maintain aspect ratio

function updateCapturedPhotosGrid() {
    const container = document.getElementById('captured-photos');
    container.innerHTML = '';
    
    capturedPhotos.forEach((photo, index) => {
        const div = document.createElement('div');
        div.className = `photo-thumbnail ${selectedPhotos.includes(index) ? 'selected' : ''}`;
        div.onclick = () => togglePhotoSelection(index);
        
        const img = document.createElement('img');
        img.src = photo;
        div.appendChild(img);
        container.appendChild(div);
    });
}

function togglePhotoSelection(index) {
    const photoIndex = selectedPhotos.indexOf(index);
    
    if (photoIndex === -1 && selectedPhotos.length < 4) {
        selectedPhotos.push(index);
    } else if (photoIndex !== -1) {
        selectedPhotos.splice(photoIndex, 1);
    }
    
    updateCapturedPhotosGrid();
    updateFinalTemplate();
}

function selectTemplate(index) {
    selectedTemplate = index;
    document.querySelectorAll('.template').forEach((template, i) => {
        template.classList.toggle('selected', i === index);
    });
    updateFinalTemplate();
}

// function updateFinalTemplate() {
//     if (selectedPhotos.length === 4) {
//         const container = document.querySelector('.final-template');
//         container.innerHTML = '';
        
//         const templateImg = document.createElement('img');
//         templateImg.src = templates[selectedTemplate].src;
//         templateImg.className = 'template-background';
//         container.appendChild(templateImg);
        
//         selectedPhotos.forEach((photoIndex, i) => {
//             const photoDiv = document.createElement('div');
//             photoDiv.className = 'photo-slot';
            
//             const position = templates[selectedTemplate].positions[i];
//             Object.assign(photoDiv.style, position);
            
//             const img = document.createElement('img');
//             img.src = capturedPhotos[photoIndex];
//             photoDiv.appendChild(img);
//             container.appendChild(photoDiv);
//         });
//     }
// }
function updateFinalTemplate() {
    if (selectedPhotos.length === 4) {
        const container = document.querySelector('.final-template');
        container.innerHTML = '';
        
        // Add template background
        const templateImg = document.createElement('img');
        templateImg.src = templates[selectedTemplate].src;
        templateImg.className = 'template-background';
        container.appendChild(templateImg);
        
        // Add photos in their positions
        selectedPhotos.forEach((photoIndex, i) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-slot';
            
            // Apply positioning from template
            const position = templates[selectedTemplate].positions[i];
            Object.assign(photoDiv.style, position);
            
            const img = document.createElement('img');
            img.src = capturedPhotos[photoIndex];
            img.style.objectFit = 'cover';
            photoDiv.appendChild(img);
            container.appendChild(photoDiv);
        });
    }
}

// function exportImage() {
//     if (selectedPhotos.length !== 4) {
//         alert('Please select 4 photos first!');
//         return;
//     }

//     const finalTemplate = document.querySelector('.final-template');
    
//     // Create timestamp
//     const now = new Date();
//     const timestamp = now.getFullYear() +
//         String(now.getMonth() + 1).padStart(2, '0') +
//         String(now.getDate()).padStart(2, '0') + '_' +
//         String(now.getHours()).padStart(2, '0') +
//         String(now.getMinutes()).padStart(2, '0') +
//         String(now.getSeconds()).padStart(2, '0');
    
//     const fileName = `Halloween2024_${timestamp}.png`;

//     html2canvas(finalTemplate, {
//         useCORS: true,
//         scale: 2,
//         backgroundColor: null,
//         logging: true,
//         onclone: function(clonedDoc) {
//             // Ensure all images are loaded in the clone
//             const images = clonedDoc.getElementsByTagName('img');
//             return Promise.all(Array.from(images).map(img => {
//                 return new Promise((resolve, reject) => {
//                     img.onload = resolve;
//                     img.onerror = reject;
//                 });
//             }));
//         }
//     }).then(canvas => {
//         // For better browser compatibility, create a temporary link
//         const link = document.createElement('a');
//         link.download = fileName;
        
//         // Convert to blob for better memory handling
//         canvas.toBlob(function(blob) {
//             const url = URL.createObjectURL(blob);
//             link.href = url;
//             link.click();
            
//             // Clean up
//             setTimeout(() => {
//                 URL.revokeObjectURL(url);
//             }, 1000);
//         }, 'image/png');
//     }).catch(error => {
//         console.error('Export failed:', error);
//         alert('Failed to export image. Please try again.');
//     });
// }

function exportImagev2() {
    if (selectedPhotos.length !== 4) {
        // alert('Please select 4 photos first!');
        showDialog(
            'Selection Required',
            'Please select exactly 4 photos before exporting.',
            dialogTypes.WARNING
        );
        return;
    }

    showDialog(
        'Preparing Export',
        'Processing your photos. Please wait...',
        dialogTypes.INFO,
        []  // No buttons during processing
    );

    const finalTemplate = document.querySelector('.final-template');
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
    `;
    loadingDiv.textContent = 'Generating image...';
    document.body.appendChild(loadingDiv);

    // Create timestamp
    const now = new Date();
    const timestamp = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    
    const fileName = `Halloween2024_${timestamp}.png`;

    // Create a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match template size
    canvas.width = 1080;
    canvas.height = 1080;

    // Load template image
    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';
    templateImg.src = templates[selectedTemplate].src;

    templateImg.onload = () => {
        // Draw template
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

        // Load and draw all selected photos
        const photoPromises = selectedPhotos.map((photoIndex, i) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = capturedPhotos[photoIndex];

                img.onload = () => {
                    const pos = templates[selectedTemplate].positions[i];
                    const x = pos.left ? (parseFloat(pos.left) / 100 * canvas.width) 
                                    : (canvas.width - (parseFloat(pos.right) / 100 * canvas.width) - (parseFloat(pos.width) / 100 * canvas.width));
                    const y = pos.top ? (parseFloat(pos.top) / 100 * canvas.height)
                                    : (canvas.height - (parseFloat(pos.bottom) / 100 * canvas.height) - (parseFloat(pos.height) / 100 * canvas.height));
                    const w = parseFloat(pos.width) / 100 * canvas.width;
                    const h = parseFloat(pos.height) / 100 * canvas.height;

                    ctx.drawImage(img, x, y, w, h);
                    resolve();
                };
                img.onerror = reject;
            });
        });

        // When all photos are drawn
        Promise.all(photoPromises)
            .then(() => {
                // Convert to blob and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = url;
                    link.click();

                    // Cleanup
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 1000);

                    // Remove loading indicator
                    document.body.removeChild(loadingDiv);
                }, 'image/png', 1.0);
            })
            .catch(error => {
                console.error('Export failed:', error);
                alert('Failed to export image. Please try again.');
                document.body.removeChild(loadingDiv);
            });
    };

    templateImg.onerror = () => {
        console.error('Failed to load template image');
        alert('Failed to load template image. Please try again.');
        document.body.removeChild(loadingDiv);
    };
}

function exportImage() {
    if (selectedPhotos.length !== 4) {
        showDialog(
            'Selection Required',
            'Please select exactly 4 photos before exporting.',
            dialogTypes.WARNING
        );
        return;
    }

    showDialog(
        'Preparing Export',
        'Processing your photos. Please wait...',
        dialogTypes.INFO,
        []  // No buttons during processing
    );

    const finalTemplate = document.querySelector('.final-template');
    
    html2canvas(finalTemplate, {
        useCORS: true,
        scale: 2
    }).then(canvas => {
        // Close the processing dialog
        const currentDialog = mdc.dialog.MDCDialog.attachTo(document.querySelector('.mdc-dialog'));
        currentDialog.close();

        // Create timestamp for filename
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const fileName = `Halloween2024_${timestamp}.png`;

        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();

            // Cleanup
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            showSuccess('Image exported successfully!');
        }, 'image/png', 1.0);
    }).catch(error => {
        console.error('Export failed:', error);
        showDialog(
            'Export Failed',
            'Failed to export image. Please try again.',
            dialogTypes.ERROR
        );
    });
}

// function resetAll() {
//     capturedPhotos = [];
//     selectedPhotos = [];
//     selectedTemplate = 0;
    
//     updateCapturedPhotosGrid();
//     document.querySelectorAll('.template').forEach((template, i) => {
//         template.classList.toggle('selected', i === 0);
//     });
//     document.querySelector('.final-template').innerHTML = '';
    
//     document.querySelectorAll('.camera-container, .templates, .captured-photos')
//         .forEach(el => {
//             el.classList.remove('fade-in');
//             void el.offsetWidth;
//             el.classList.add('fade-in');
//         });
// }


function resetAll() {
    showDialog(
        'Confirm Reset',
        'This will clear all photos and selections. Are you sure?',
        dialogTypes.WARNING,
        [
            {
                text: 'Cancel',
                action: 'close',
                isPrimary: false
            },
            {
                text: 'Reset',
                action: 'reset',
                isPrimary: true,
                callback: () => {
                    capturedPhotos = [];
                    selectedPhotos = [];
                    selectedTemplate = 0;
                    
                    updateCapturedPhotosGrid();
                    document.querySelectorAll('.template').forEach((template, i) => {
                        template.classList.toggle('selected', i === 0);
                    });
                    document.querySelector('.final-template').innerHTML = '';
                    
                    showSuccess('All content has been reset!');
                }
            }
        ]
    );
}

// Success notification helper
function showSuccess(message) {
    const snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    snackbar.labelText = message;
    snackbar.timeoutMs = 3000;
    snackbar.open();
}

function printTemplate() {
    if (selectedPhotos.length !== 4) {
        alert('Please select 4 photos first!');
        return;
    }

    // Create a loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
    `;
    loadingDiv.textContent = 'Preparing to print...';
    document.body.appendChild(loadingDiv);

    // Wait for all images to load before printing
    const images = document.querySelectorAll('.final-template img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to avoid hanging
        });
    });

    Promise.all(imagePromises)
        .then(() => {
            // Remove loading indicator
            document.body.removeChild(loadingDiv);
            
            // Trigger print dialog
            window.print();
        })
        .catch(error => {
            console.error('Print preparation failed:', error);
            document.body.removeChild(loadingDiv);
            alert('Failed to prepare for printing. Please try again.');
        });
}

// Initialize Material components
let snackbar;
let dialog;

function initializeNotifications() {
    // Initialize snackbar
    snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
    
    // Initialize dialog
    dialog = new mdc.dialog.MDCDialog(document.querySelector('.mdc-dialog'));
}

// Show success message
function showSuccess(message) {
    snackbar.labelText = message;
    snackbar.timeoutMs = 4000;
    snackbar.open();
}

// Show error dialog
function showError(title, message) {
    const dialogEl = document.querySelector('.mdc-dialog');
    dialogEl.querySelector('.mdc-dialog__title').textContent = title;
    dialogEl.querySelector('.mdc-dialog__content').textContent = message;
    dialog.open();
}
// Dialog utility functions
const dialogTypes = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info'
};

function showDialog(title, message, type = dialogTypes.INFO, buttons = []) {
    const dialog = document.querySelector('.mdc-dialog');
    const dialogTitle = dialog.querySelector('.mdc-dialog__title');
    const dialogContent = dialog.querySelector('.mdc-dialog__content');
    const dialogActions = dialog.querySelector('.mdc-dialog__actions');

    // Set dialog content
    dialogTitle.textContent = title;
    dialogContent.textContent = message;

    // Set dialog style based on type
    dialogTitle.className = 'mdc-dialog__title';
    dialogTitle.classList.add(`mdc-dialog__title--${type}`);

    // Clear existing buttons
    dialogActions.innerHTML = '';

    // Add new buttons
    if (buttons.length === 0) {
        // Default OK button
        buttons = [{
            text: 'OK',
            action: 'close',
            isPrimary: true
        }];
    }

    buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.className = `mdc-button ${button.isPrimary ? 'mdc-button--raised' : 'mdc-button--outlined'}`;
        btnElement.setAttribute('data-mdc-dialog-action', button.action || 'close');
        
        btnElement.innerHTML = `
            <span class="mdc-button__ripple"></span>
            <span class="mdc-button__label">${button.text}</span>
        `;

        if (button.callback) {
            btnElement.addEventListener('click', button.callback);
        }

        dialogActions.appendChild(btnElement);
    });

    // Initialize and open dialog
    const mdcDialog = new mdc.dialog.MDCDialog(dialog);
    mdcDialog.open();

    return mdcDialog;
}
// Update window.onload to include print button initialization
window.onload = () => {
    initCamera();
    initializeNotifications();
    loadTemplateImages();
    document.querySelectorAll('.mdc-button').forEach(button => {
        new mdc.ripple.MDCRipple(button);
    });

    // Add print cancel handler
    window.onafterprint = () => {
        // Any cleanup needed after printing
        console.log('Printing completed or cancelled');
    };
};



// window.onload = () => {
//     initCamera();
//     document.querySelectorAll('.mdc-button').forEach(button => {
//         new mdc.ripple.MDCRipple(button);
//     });
// }