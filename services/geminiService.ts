import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a single enhanced image from a product photo.
 */
export async function enhanceImage(
  productImage: { base64: string; mimeType: string }
): Promise<{ finalImage: string | null; text: string | null }> {
  
  const productPart = {
    inlineData: {
      data: productImage.base64,
      mimeType: productImage.mimeType,
    },
  };

  const textPrompt = `
    You are an expert AI photo editor specializing in product photography. Your primary goal is to create a stunning, social-media-ready image from a user-submitted product photo.

    **GOLDEN RULE: The product in the image MUST remain completely untouched. Do NOT modify, alter, edit, enhance, or change the product itself in any way. This is especially true for any intricate details, designs, or text (like the Arabic calligraphy) on the product. Preserve the product perfectly.**

    Follow these steps precisely:
    1.  **Identify and Isolate:** Perfectly identify the product and separate it from its original background.
    2.  **Create Background:** Generate a new, elegant, and professional background that complements the product. Good themes are minimal, soft-focus, or event-themed (like a wedding).
    3.  **Place Product:** Place the original, completely unaltered product onto the new background.
    4.  **Adjust Global Lighting:** Make subtle adjustments to the overall lighting and shadows to ensure the product looks natural on the new background. This should not change the product's own colors or details.
    
    **CRITICAL OUTPUT INSTRUCTIONS:**
    You MUST return only ONE image part in your response: The final, completed image of the product on its new background, in a square (1:1) aspect ratio.
  `;
  
  const parts = [productPart, { text: textPrompt }];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  let finalImage: string | null = null;
  let text: string | null = null;
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData?.data) {
      finalImage = part.inlineData.data;
      break; // Found the first image, that's all we need.
    } else if (part.text) {
      text = part.text;
    }
  }

  return { 
    finalImage,
    text 
  };
}


/**
 * Places a new product image into a scene inspired by a style reference image.
 */
export async function applyStyleFromReference(
  productImage: { base64: string; mimeType: string },
  styleReferenceImage: { base64: string; mimeType: string }
): Promise<{ base64Image: string | null; text: string | null }> {

  const productPart = {
    inlineData: { data: productImage.base64, mimeType: productImage.mimeType },
  };

  const styleReferencePart = {
    inlineData: { data: styleReferenceImage.base64, mimeType: styleReferenceImage.mimeType },
  };
  
  const textPrompt = `
    You are an expert AI photo editor performing a "product swap". You will be given two images:
    - [Image 1]: A new product.
    - [Image 2]: A "Style Reference" image containing an old product on a finished background.

    **Your mission is to replace the old product in [Image 2] with the new product from [Image 1].**

    **GOLDEN RULE: The new product from [Image 1] MUST remain completely untouched. Do NOT modify, alter, edit, or change it in any way. Preserve its original appearance perfectly.**

    Follow these steps exactly:
    1.  Identify the new product in [Image 1] and the old product in [Image 2].
    2.  Carefully remove the old product from [Image 2], leaving only its background and atmosphere.
    3.  Take the original, unaltered new product from [Image 1] and place it perfectly into the background from [Image 2].
    4.  Adjust global lighting and shadows to make the new product look natural in the scene. Do not change the new product itself.

    **CRITICAL OUTPUT INSTRUCTIONS:**
    - The final image MUST contain the new product from [Image 1].
    - The final image MUST NOT contain the old product from [Image 2].
    - The final image MUST NOT be the same as [Image 2].
    - Output a single, high-quality, square (1:1 aspect ratio) composite image.
  `;

  // The model expects the primary subject, then the reference, then the instructions.
  const parts = [productPart, styleReferencePart, { text: textPrompt }];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let base64Image: string | null = null;
  let text: string | null = null;
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      base64Image = part.inlineData.data;
      break; // We only expect one image back
    } else if (part.text) {
      text = part.text;
    }
  }

  return { base64Image, text };
}

/**
 * Upscales an image to a higher resolution and quality.
 */
export async function upscaleImage(
  image: { base64: string; mimeType: string }
): Promise<{ upscaledImage: string | null; text: string | null }> {

  const imagePart = {
    inlineData: { data: image.base64, mimeType: image.mimeType },
  };
  
  const textPrompt = `
    You are an expert AI image upscaler. Your sole task is to increase the resolution and detail of the provided image.

    **GOLDEN RULE: Do NOT change the content, composition, colors, or style of the image in any way. The output must be the IDENTICAL image, but at a significantly higher resolution and with enhanced sharpness and clarity.**

    Follow these steps:
    1. Analyze the input image.
    2. Re-render it at a higher resolution, intelligently adding detail where appropriate (e.g., texture, edges).
    3. Ensure the result is a crisp, high-quality version of the original.

    **CRITICAL OUTPUT INSTRUCTIONS:**
    - Output a single, high-resolution image part.
    - Do not add any text or other elements.
    - The aspect ratio must be preserved.
  `;

  const parts = [imagePart, { text: textPrompt }];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let upscaledImage: string | null = null;
  let text: string | null = null;
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      upscaledImage = part.inlineData.data;
      break;
    } else if (part.text) {
      text = part.text;
    }
  }

  return { upscaledImage, text };
}