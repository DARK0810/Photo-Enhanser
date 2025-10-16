<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Product Photo Enhancer

Transform your product photos with AI-powered automatic background replacement and professional studio lighting. This bilingual (English/Arabic) app uses Google's Gemini AI to create stunning, social-media-ready images with:

- **Automatic Background Replacement**: AI intelligently removes your product's background and generates a professional scene
- **Studio-Quality Lighting**: Automatically applies professional lighting adjustments
- **Background Reuse**: Save and reuse your favorite backgrounds with new products
- **Image Upscaling**: Enhance resolution and detail of your final images
- **Batch Image Converter**: Convert multiple images between WEBP, PNG, and JPG formats

View your app in AI Studio: https://ai.studio/apps/drive/1QWk77dlFXpYMRtRRmWxk2s-_y6J890Og

## Getting Your Free Gemini API Key

This app uses Google's Gemini AI, which offers a **free tier** for developers. To get your API key:

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy your API key (keep it secure and never commit it to version control)

### Usage Limits

The free tier of Gemini API includes:
- **Rate limits**: 15 requests per minute (RPM) and 1 million tokens per minute (TPM)
- **Daily quota**: 1,500 requests per day
- Perfect for personal projects and development

For production use or higher limits, consider upgrading to a paid plan at [Google AI pricing](https://ai.google.dev/pricing).

## Run Locally

**Prerequisites:**  Node.js (v16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your API key:**
   
   Create a `.env.local` file in the project root:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
   
   Replace `your_api_key_here` with your actual Gemini API key from Google AI Studio.

3. **Run the app:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## Features

### Photo Enhancer
- Upload product images (PNG, JPG, WEBP up to 5MB)
- Optional style reference images to guide the AI's background generation
- Before/after comparison slider
- Download enhanced images
- Upscale for higher resolution
- Reuse backgrounds across multiple products

### Image Converter
- Batch convert images to WEBP, PNG, or JPG
- Client-side processing (no upload required)
- Drag-and-drop support
