const { Readable } = require('stream');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const uploadImageBuffer = (file, folder) => {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env.');
    }

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Image upload timed out. Please try a smaller photo or try again.'));
        }, 30000);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                clearTimeout(timeout);
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height
                });
            }
        );

        uploadStream.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });

        Readable.from(file.buffer)
            .on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            })
            .pipe(uploadStream);
    });
};

module.exports = {
    uploadImageBuffer
};
