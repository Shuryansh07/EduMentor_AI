/* Cloudinary integration check. Run: npm run test:cloudinary
   Uses the project's env-based config (no inline credentials). */
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import env from '../config/env.js';

async function run() {
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured — check CLOUDINARY_* in server/.env');
    process.exit(1);
  }
  console.log(`Using cloud: ${env.cloudinary.cloudName}\n`);

  // 1) Upload a sample image from Cloudinary's demo domain.
  const sample = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const result = await cloudinary.uploader.upload(sample, {
    folder: `${env.cloudinary.folder}/_healthcheck`,
  });
  console.log('✅ Upload OK');
  console.log('   secure_url:', result.secure_url);
  console.log('   public_id :', result.public_id);

  // 2) Fetch details (metadata) for the uploaded asset.
  const info = await cloudinary.api.resource(result.public_id);
  console.log('\n📐 Image details');
  console.log('   width :', info.width);
  console.log('   height:', info.height);
  console.log('   format:', info.format);
  console.log('   bytes :', info.bytes);

  // 3) Build an optimized URL:
  //    f_auto → picks the best format (e.g. WebP/AVIF) for the browser
  //    q_auto → picks the best quality/compression automatically
  const optimized = cloudinary.url(result.public_id, {
    fetch_format: 'auto', // f_auto
    quality: 'auto', // q_auto
    secure: true,
  });
  console.log('\n🎉 Done! Open the optimized URL below — check its size and format:');
  console.log('   ', optimized);

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Cloudinary test failed:', err?.error?.message || err.message);
  process.exit(1);
});
