import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

type GeminiImagePayload = { base64: string; mimeType: string };

type GeminiEnhanceResult = { finalImage: string | null; message: string | null };
type GeminiStyleResult = { base64Image: string | null; message: string | null };
type GeminiUpscaleResult = { upscaledImage: string | null; message: string | null };

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Gemini model leveraged for all enhancer flows. This variant is covered by
 * Google AI Studio's free tier quotas while still supporting background
 * replacement and lighting adjustments in a single call.
 */
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image-preview";

const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const GENERIC_ERROR_MESSAGE =
  "حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى بعد قليل.\n" +
  "An error occurred while processing the image. Please try again in a moment.";

const QUOTA_ERROR_MESSAGE =
  "تم استهلاك الحد المجاني الخاص بهذه الميزة. يرجى الانتظار قليلاً قبل إعادة المحاولة أو استخدام خطة مدفوعة.\n" +
  "The free tier quota for this feature has been reached. Please wait before retrying or switch to a paid plan.";

const AUTH_ERROR_MESSAGE =
  "لا يمكن التحقق من مفتاح Gemini API. يرجى التأكد من صحة الإعدادات ثم المحاولة مرة أخرى.\n" +
  "We could not verify the Gemini API key. Please double-check your configuration and try again.";

const BAD_REQUEST_ERROR_MESSAGE =
  "تعذر على Gemini معالجة الصورة المرسلة. يرجى التأكد من أن الملف صورة صالحة ثم المحاولة مرة أخرى.\n" +
  "Gemini could not process the provided image payload. Please ensure it is a valid image and try again.";

const PAYLOAD_GENERIC_MESSAGE =
  "الصورة المرسلة كبيرة جداً ولا يمكن معالجتها كما هي.\n" +
  "The uploaded image is too large for the AI request.";

const PAYLOAD_HINT_MESSAGE =
  `يرجى تصغير أو ضغط الصورة بحيث لا تتجاوز ${MAX_IMAGE_MB} ميجابايت للحفاظ على حدود الاستخدام المجاني.\n` +
  `Please resize or compress the image so it stays under ${MAX_IMAGE_MB} MB to remain within the free tier.`;

const PRODUCT_IMAGE_LABEL = "صورة المنتج / Product image";
const STYLE_REFERENCE_LABEL = "الصورة المرجعية / Style reference";
const UPSCALE_IMAGE_LABEL = "الصورة الحالية / Current image";

const estimateBytesFromBase64 = (base64: string): number => {
  return Math.ceil((base64.length * 3) / 4);
};

const validatePayloadWithinLimits = (payload: GeminiImagePayload, label: string): string | null => {
  const estimatedBytes = estimateBytesFromBase64(payload.base64);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    const sizeMb = (estimatedBytes / (1024 * 1024)).toFixed(1);
    return `${label} - الحجم الحالي حوالي ${sizeMb} ميجابايت، وهو أكبر من الحد (${MAX_IMAGE_MB} ميجابايت).\n${PAYLOAD_HINT_MESSAGE}`;
  }
  return null;
};

const extractImageFromResponse = (
  response: GenerateContentResponse
): { image: string | null; message: string | null } => {
  const candidates = response?.candidates ?? [];
  if (!candidates.length) {
    return { image: null, message: GENERIC_ERROR_MESSAGE };
  }

  let fallbackMessage: string | null = null;

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return { image: part.inlineData.data, message: null };
      }
      if (!fallbackMessage && part.text) {
        fallbackMessage = part.text;
      }
    }
  }

  return { image: null, message: fallbackMessage };
};

const translateGeminiError = (error: any): string => {
  console.error("Gemini API Error:", error);

  const status = typeof error?.status === "string" ? error.status : "";
  const code = typeof error?.code === "number" ? error.code : undefined;
  const responseStatus = typeof error?.response?.status === "number" ? error.response.status : undefined;
  const message = typeof error?.message === "string" ? error.message : "";
  const combined = `${status} ${message}`.toUpperCase();

  const isQuotaIssue =
    status === "RESOURCE_EXHAUSTED" ||
    code === 429 ||
    responseStatus === 429 ||
    combined.includes("RESOURCE_EXHAUSTED") ||
    combined.includes("RATE_LIMIT");
  if (isQuotaIssue) {
    return QUOTA_ERROR_MESSAGE;
  }

  const isAuthIssue =
    status === "PERMISSION_DENIED" ||
    status === "UNAUTHENTICATED" ||
    code === 401 ||
    code === 403 ||
    responseStatus === 401 ||
    responseStatus === 403;
  if (isAuthIssue) {
    return AUTH_ERROR_MESSAGE;
  }

  const isPayloadIssue =
    code === 413 ||
    responseStatus === 413 ||
    status === "OUT_OF_RANGE" ||
    combined.includes("PAYLOAD") ||
    combined.includes("TOO LARGE") ||
    combined.includes("EXCEED");
  if (isPayloadIssue) {
    return `${PAYLOAD_GENERIC_MESSAGE}\n${PAYLOAD_HINT_MESSAGE}`;
  }

  const isBadRequest = status === "INVALID_ARGUMENT" || code === 400 || responseStatus === 400;
  if (isBadRequest) {
    if (combined.includes("IMAGE") || combined.includes("MEDIA")) {
      return BAD_REQUEST_ERROR_MESSAGE;
    }
    return `${BAD_REQUEST_ERROR_MESSAGE}\n${PAYLOAD_HINT_MESSAGE}`;
  }

  return GENERIC_ERROR_MESSAGE;
};

const buildEnhancePrompt = (): string => `
You are an expert AI photo editor specializing in premium ecommerce product photography. A brand has sent you a single product photo and expects a ready-to-publish hero shot.

Hard requirements — complete all of them in this single request:
1. Accurately cut out the product and discard the original background entirely.
2. Design a new elegant, studio-quality background (soft gradients, modern surfaces, seasonal environments) that compliments the product. Do not reuse any pixels from the original background.
3. Apply professional three-point lighting and natural contact shadows so the product appears well lit and polished. Preserve the product’s original colors, textures, and printed details.
4. Blend the product seamlessly into the new scene. Ensure reflections, shadows, and light direction are physically consistent.

Output formatting:
- Return exactly ONE final image part containing the finished composition.
- Use a square (1:1) aspect ratio suitable for social media.
- Do not add watermarks, captions, or extra objects.
`.trim();

/**
 * Generates a single enhanced image from a product photo with automatic background
 * replacement and professional lighting, all in one Gemini call.
 */
export async function enhanceImage(
  productImage: GeminiImagePayload
): Promise<GeminiEnhanceResult> {
  const sizeError = validatePayloadWithinLimits(productImage, PRODUCT_IMAGE_LABEL);
  if (sizeError) {
    return { finalImage: null, message: sizeError };
  }

  try {
    const productPart = {
      inlineData: {
        data: productImage.base64,
        mimeType: productImage.mimeType,
      },
    };

    const textPrompt = buildEnhancePrompt();
    const parts = [productPart, { text: textPrompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const { image, message } = extractImageFromResponse(response);
    if (!image) {
      return { finalImage: null, message: message ?? GENERIC_ERROR_MESSAGE };
    }

    return { finalImage: image, message: message ?? null };
  } catch (error) {
    return { finalImage: null, message: translateGeminiError(error) };
  }
}

/**
 * Places a new product image into a scene inspired by a style reference image.
 */
export async function applyStyleFromReference(
  productImage: GeminiImagePayload,
  styleReferenceImage: GeminiImagePayload
): Promise<GeminiStyleResult> {
  const productSizeError = validatePayloadWithinLimits(productImage, PRODUCT_IMAGE_LABEL);
  if (productSizeError) {
    return { base64Image: null, message: productSizeError };
  }

  const styleSizeError = validatePayloadWithinLimits(styleReferenceImage, STYLE_REFERENCE_LABEL);
  if (styleSizeError) {
    return { base64Image: null, message: styleSizeError };
  }

  try {
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

GOLDEN RULE: The new product from [Image 1] MUST remain completely untouched. Do NOT modify, alter, edit, or change it in any way. Preserve its original appearance perfectly.

Follow these steps exactly:
1. Identify the new product in [Image 1] and the old product in [Image 2].
2. Carefully remove the old product from [Image 2], leaving only its background and atmosphere.
3. Place the unaltered new product from [Image 1] perfectly into the background from [Image 2].
4. Match lighting and shadows so the new product looks naturally integrated without changing its colors.

CRITICAL OUTPUT INSTRUCTIONS:
- The final image MUST contain the new product from [Image 1].
- The final image MUST NOT contain the old product from [Image 2].
- The final image MUST NOT be the same as [Image 2].
- Output a single, high-quality, square (1:1 aspect ratio) composite image.
`.trim();

    const parts = [productPart, styleReferencePart, { text: textPrompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const { image, message } = extractImageFromResponse(response);

    if (!image) {
      return { base64Image: null, message: message ?? GENERIC_ERROR_MESSAGE };
    }

    return { base64Image: image, message: message ?? null };
  } catch (error) {
    return {
      base64Image: null,
      message: translateGeminiError(error),
    };
  }
}

/**
 * Upscales an image to a higher resolution and quality.
 */
export async function upscaleImage(
  image: GeminiImagePayload
): Promise<GeminiUpscaleResult> {
  const sizeError = validatePayloadWithinLimits(image, UPSCALE_IMAGE_LABEL);
  if (sizeError) {
    return { upscaledImage: null, message: sizeError };
  }

  try {
    const imagePart = {
      inlineData: { data: image.base64, mimeType: image.mimeType },
    };

    const textPrompt = `
You are an expert AI image upscaler. Your sole task is to increase the resolution and detail of the provided image.

GOLDEN RULE: Do NOT change the content, composition, colors, or style of the image in any way. The output must be the IDENTICAL image, but at a significantly higher resolution and with enhanced sharpness and clarity.

Follow these steps:
1. Analyze the input image.
2. Re-render it at a higher resolution, intelligently adding detail where appropriate (e.g., texture, edges).
3. Ensure the result is a crisp, high-quality version of the original.

CRITICAL OUTPUT INSTRUCTIONS:
- Output a single, high-resolution image part.
- Do not add any text or other elements.
- The aspect ratio must be preserved.
`.trim();

    const parts = [imagePart, { text: textPrompt }];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const { image: upscaledImage, message } = extractImageFromResponse(response);

    if (!upscaledImage) {
      return { upscaledImage: null, message: message ?? GENERIC_ERROR_MESSAGE };
    }

    return { upscaledImage, message: message ?? null };
  } catch (error) {
    return {
      upscaledImage: null,
      message: translateGeminiError(error),
    };
  }
}
