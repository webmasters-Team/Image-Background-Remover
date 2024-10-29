document.getElementById('fileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        const loadingBar = document.getElementById('loadingBar');
        const loadingBarInner = loadingBar.querySelector('div');
        loadingBar.style.display = 'block';
        loadingBarInner.style.width = '50%'; 

        const imageData = await convertImageToBlob(file);
        loadingBarInner.style.width = '75%'; 

        const resultURL = await processImageWithAPIs(imageData);
        loadingBarInner.style.width = '100%'; 

        if (resultURL) {
            document.getElementById('output').innerHTML = `<img src="${resultURL}" alt="Processed Image">`;
            const downloadButton = document.getElementById('downloadButton');
            downloadButton.href = resultURL;
            downloadButton.style.display = 'inline-block';
        } else {
            document.getElementById('output').innerText = 'Failed to process image.';
        }
        loadingBar.style.display = 'none';
        loadingBarInner.style.width = '0';
    }
});

async function convertImageToBlob(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = this.width;
                canvas.height = this.height;

                ctx.drawImage(this, 0, 0);

                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, file.type, 1);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function processImageWithAPIs(imageData) {
    for (const api of apis) {
        try {
            const formData = new FormData();
            formData.append('image_file', imageData);

            const response = await fetch(api.url, {
                method: 'POST',
                headers: {
                    'X-API-Key': api.key
                },
                body: formData
            });

            if (response.ok) {
                const resultBlob = await response.blob();
                const upscaledBlob = await upscaleImage(resultBlob);
                return URL.createObjectURL(upscaledBlob);
            }
        } catch (error) {
            console.error(`Error processing image with ${api.name}:`, error);
        }
    }
    console.error('Failed to remove background using any API.');
    return null;
}

function upscaleImage(blob) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const scaleFactor = 2; 
            canvas.width = img.width * scaleFactor;
            canvas.height = img.height * scaleFactor;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((upscaledBlob) => {
                resolve(upscaledBlob);
            }, 'image/png', 1); 
        };
    });
}

const apis = [
    { name: 'remove.bg', url: 'https://api.remove.bg/v1.0/removebg', key: '7kon563V3BjY9cWnzrgEfH4J' },
    { name: 'removal.ai', url: 'https://api.removal.ai/3.0/remove', key: 'D58ABDBB-195B-D48A-93FC-DFB72F8752EC' },
    { name: 'photoroom.com', url: 'https://sdk.photoroom.com/v1/segment', key: '67b89b606e63fc358ffd386ebe2f107666784d1d' },
    { name: 'clipdrop.co', url: 'https://clipdrop-api.co/remove-background/v1', key: 'b347321727a96308a6d80412bda326cc9e0b9dd0e120b65abd7799b2d5fbbed295ba6cd68bed4d80359784cd4e9c9170' },
    { name: 'slazzer.com', url: 'https://api.slazzer.com/v2.0/remove_image_background', key: 'c98d015bbfb34592bd555a3a721ccfcc' },
    { name: 'picwish.com', url: 'https://techhk.aoscdn.com/api/tasks/visual/segmentation', key: 'wxq8mm82c86zs78w5' }
];