const cloudinary = require('cloudinary').v2;

function initCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    // Not throwing here because the assignment says "store photo on Cloudinary" only when needed.
    // We will throw a clear error when a mutation actually tries to upload.
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

async function uploadEmployeePhoto(employeePhotoString, publicId) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary env vars missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  const folder = process.env.CLOUDINARY_FOLDER || 'comp3133_employee_photos';

  // employeePhotoString can be:
  //  - a public image URL
  //  - a base64 data URI: data:image/png;base64,....
  const res = await cloudinary.uploader.upload(employeePhotoString, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image'
  });

  return {
    url: res.secure_url,
    public_id: res.public_id
  };
}

module.exports = { initCloudinary, uploadEmployeePhoto };
