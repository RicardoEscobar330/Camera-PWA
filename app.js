// DOM elements
const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const switchCameraBtn = document.getElementById('switchCamera');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const photosGrid = document.getElementById('photosGrid');
const clearGalleryBtn = document.getElementById('clearGallery');
const scrollHint = document.getElementById('scrollHint');
let galleryEmpty = document.getElementById('galleryEmpty');

// Global variables
let stream = null;
let currentFacingMode = 'environment'; // 'environment' = rear, 'user' = front
let photoCounter = 0;

// Camera functions
async function openCamera() {
    try {
        const constraints = {
            video: {
                facingMode: { ideal: currentFacingMode },
                width: { ideal: 320 },
                height: { ideal: 240 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Activa';
        openCameraBtn.disabled = true;
        
        console.log('Cámara abierta - Modo: ' + currentFacingMode);
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Por favor asegúrate de otorgar los permisos necesarios.');
    }
}

function takePhoto() {
    if (!stream) {
        alert('Por favor abre la cámara primero');
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
    
    addPhotoToGallery(imageDataURL);
    console.log('Foto capturada y agregada a la galería');
    
    const successMsg = document.createElement('div');
    successMsg.textContent = 'Foto guardada en la galería';
    successMsg.className = 'success-message';
    cameraContainer.appendChild(successMsg);
    
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.parentNode.removeChild(successMsg);
        }
    }, 2000);
}

async function switchCamera() {
    if (stream) {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        
        stream.getTracks().forEach(track => track.stop());
        
        try {
            const constraints = {
                video: {
                    facingMode: { ideal: currentFacingMode },
                    width: { ideal: 320 },
                    height: { ideal: 240 }
                }
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            
            const cameraType = currentFacingMode === 'environment' ? 'trasera' : 'frontal';
            console.log('Cámara cambiada a: ' + cameraType);
        } catch (error) {
            console.error('Error al cambiar la cámara:', error);
            alert('No se pudo cambiar la cámara. Tu dispositivo puede no tener ambas cámaras disponibles.');
        }
    }
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;

        video.srcObject = null;
        cameraContainer.style.display = 'none';
        
        openCameraBtn.textContent = 'Abrir Cámara';
        openCameraBtn.disabled = false;
        
        console.log('Cámara cerrada');
    }
}

// Gallery functions will continue in next part...
console.log('Camera PWA loading...');

// Gallery functions
function addPhotoToGallery(imageDataURL) {
    photoCounter++;
    
    if (galleryEmpty) {
        galleryEmpty.style.display = 'none';
    }
    
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = '<img src="' + imageDataURL + '" alt="Foto ' + photoCounter + '"><div class="photo-actions"><button onclick="downloadSinglePhoto(\'' + imageDataURL + '\', ' + photoCounter + ')" title="Descargar">Descargar</button><button onclick="deleteSinglePhoto(this, ' + photoCounter + ')" class="btn-danger" title="Eliminar">Eliminar</button></div>';
    
    if (photosGrid.firstChild === galleryEmpty) {
        photosGrid.appendChild(photoItem);
    } else {
        photosGrid.insertBefore(photoItem, photosGrid.firstChild);
    }
    
    savePhotoToStorage(imageDataURL, photoCounter);
    updateGalleryCounter();
    photoItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
}

function downloadSinglePhoto(imageDataURL, photoNumber) {
    const link = document.createElement('a');
    link.download = 'foto-camara-' + photoNumber + '-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.png';
    link.href = imageDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Foto ' + photoNumber + ' descargada');
}

function deleteSinglePhoto(button, photoNumber) {
    const photoItem = button.closest('.photo-item');
    
    if (confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
        photoItem.remove();
        removePhotoFromStorage(photoNumber);
        updateGalleryCounter();
        checkIfGalleryEmpty();
        console.log('Foto ' + photoNumber + ' eliminada');
    }
}

function checkIfGalleryEmpty() {
    const savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    if (savedPhotos.length === 0 && galleryEmpty) {
        galleryEmpty.style.display = 'block';
        scrollHint.style.display = 'none';
    }
}

function updateGalleryCounter() {
    const savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    const galleryTitle = document.querySelector('.gallery-title');
    const photoCount = savedPhotos.length;
    
    if (photoCount === 0) {
        galleryTitle.textContent = 'Galería de Fotos';
        scrollHint.style.display = 'none';
    } else {
        galleryTitle.textContent = 'Galería de Fotos (' + photoCount + ')';
        if (photoCount > 2) {
            scrollHint.style.display = 'inline';
        } else {
            scrollHint.style.display = 'none';
        }
    }
}

function clearGallery() {
    const savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    const photoCount = savedPhotos.length;
    
    if (photoCount === 0) {
        alert('No hay fotos en la galería para eliminar');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar todas las ' + photoCount + ' fotos de la galería?')) {
        photosGrid.innerHTML = '<div id="galleryEmpty" class="gallery-empty">Toma tu primera foto para comenzar la galería</div>';
        photoCounter = 0;
        clearAllPhotosFromStorage();
        
        galleryEmpty = document.getElementById('galleryEmpty');
        updateGalleryCounter();
        console.log('Galería limpiada - ' + photoCount + ' fotos eliminadas');
        
        const confirmMsg = document.createElement('div');
        confirmMsg.textContent = photoCount + ' fotos eliminadas de la galería';
        confirmMsg.className = 'success-message';
        confirmMsg.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
        document.querySelector('.gallery').appendChild(confirmMsg);
        
        setTimeout(() => {
            if (confirmMsg.parentNode) {
                confirmMsg.parentNode.removeChild(confirmMsg);
            }
        }, 3000);
    }
}

// localStorage functions
function savePhotoToStorage(imageDataURL, photoNumber) {
    localStorage.setItem('photo_' + photoNumber, imageDataURL);
    localStorage.setItem('photoCounter', photoCounter.toString());
    
    let savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    if (!savedPhotos.includes(photoNumber)) {
        savedPhotos.push(photoNumber);
        localStorage.setItem('savedPhotosIndex', JSON.stringify(savedPhotos));
    }
}

function removePhotoFromStorage(photoNumber) {
    localStorage.removeItem('photo_' + photoNumber);
    
    let savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    savedPhotos = savedPhotos.filter(num => num !== photoNumber);
    localStorage.setItem('savedPhotosIndex', JSON.stringify(savedPhotos));
}

function clearAllPhotosFromStorage() {
    let savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    
    savedPhotos.forEach(photoNumber => {
        localStorage.removeItem('photo_' + photoNumber);
    });
    
    localStorage.removeItem('savedPhotosIndex');
    localStorage.removeItem('photoCounter');
}

function loadSavedPhotos() {
    const savedCounter = localStorage.getItem('photoCounter');
    if (savedCounter) {
        photoCounter = parseInt(savedCounter);
    }
    
    let savedPhotos = JSON.parse(localStorage.getItem('savedPhotosIndex') || '[]');
    
    savedPhotos.sort((a, b) => b - a).forEach(photoNumber => {
        const savedPhoto = localStorage.getItem('photo_' + photoNumber);
        if (savedPhoto) {
            if (galleryEmpty) {
                galleryEmpty.style.display = 'none';
            }
            
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = '<img src="' + savedPhoto + '" alt="Foto ' + photoNumber + '"><div class="photo-actions"><button onclick="downloadSinglePhoto(\'' + savedPhoto + '\', ' + photoNumber + ')" title="Descargar">Descargar</button><button onclick="deleteSinglePhoto(this, ' + photoNumber + ')" class="btn-danger" title="Eliminar">Eliminar</button></div>';
            photosGrid.appendChild(photoItem);
        }
    });
    
    if (savedPhotos.length > 0) {
        console.log(savedPhotos.length + ' fotos guardadas cargadas');
    }
    
    updateGalleryCounter();
}

// Event listeners
openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);
switchCameraBtn.addEventListener('click', switchCamera);
clearGalleryBtn.addEventListener('click', clearGallery);

window.addEventListener('beforeunload', () => {
    closeCamera();
});

window.addEventListener('DOMContentLoaded', () => {
    loadSavedPhotos();
});

console.log('PWA Cámara cargada con diseño profesional mejorado.');