
import { GoogleGenAI, Type } from "@google/genai";
import { BrandKit, Campaign, Assets, DesignJSON, QAReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const validateInputsAndAskQuestions = async (brand: BrandKit, campaign: Campaign) => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    SYSTEM ROLE: FlyerForge Pro - Lead Auditor.
    TASK: Check if the following campaign brief is production-ready.
    REQUIRED FIELDS: target_platforms, cta_text, output_format, and either headline or body_copy.

    Campaign Brief: ${JSON.stringify(campaign)}

    IF CRITICAL INFO IS MISSING:
    Return a list of up to 8 clarifying questions to the user.
    IF ALL GOOD:
    Return an empty list.

    OUTPUT FORMAT: JSON
    Schema: { "questions": string[] }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
};

export const forgeStrategyAndConcepts = async (brand: BrandKit, campaign: Campaign, assets: Assets) => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    SYSTEM ROLE: FlyerForge Pro - Art Director.
    TASK: Generate Creative Strategy and 3 Concept Variants (A/B/C) based on the BrandKit and Campaign brief.

    NON-NEGOTIABLE RULES:
    1) DO NOT invent facts (addresses, prices, dates). Use provided info only.
    2) If no photos are provided, generate 2-4 image-generation prompts.

    INPUTS:
    BrandKit: ${JSON.stringify(brand)}
    Campaign: ${JSON.stringify(campaign)}
    Assets: ${JSON.stringify(assets)}

    OUTPUT FORMAT: JSON
    Schema:
    {
      "strategy": ["bullet1", "bullet2", ...],
      "image_prompts": ["prompt1", "prompt2"],
      "concepts": [
        { "id": "A", "title": "...", "desc": "...", "layout_direction": "..." },
        { "id": "B", "title": "...", "desc": "...", "layout_direction": "..." },
        { "id": "C", "title": "...", "desc": "...", "layout_direction": "..." }
      ],
      "winner_selection": { "id": "A|B|C", "rationale": "..." }
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
};

export const generateInitialDesign = async (brand: BrandKit, campaign: Campaign, assets: Assets, concept: any) => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    TASK: Generate a production-ready Design JSON and a single self-contained SVG for the concept: "${concept.title}".
    
    PLATFORM: ${campaign.target_platforms[0]}
    
    GUIDELINES:
    - Use brand colors: ${brand.colors.primary}, ${brand.colors.secondary}, ${brand.colors.cream}.
    - Fonts: Display="${brand.fonts.display_font}", Body="${brand.fonts.body_font}".
    - Print specs if applicable: 0.125in bleed, 0.25in safe margin.
    - Social specs if applicable: 1080px width, safe zones for UI.
    - SVG must be valid, high-quality, and use <text> elements for editability.
    - DO NOT include external images. Use placeholders or color blocks if Assets.photos is empty.

    OUTPUT FORMAT: JSON
    Schema:
    {
      "design_json": { ... },
      "svg_code": "<svg>...</svg>",
      "production_notes": "Export settings, resolution guidance, etc."
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });

  return JSON.parse(response.text);
};

export const performQAAndIterate = async (
  brand: BrandKit, 
  campaign: Campaign, 
  assets: Assets, 
  currentDesign: DesignJSON, 
  currentSvg: string, 
  iterationCount: number
) => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    SYSTEM ROLE: Brand Compliance Auditor.
    TASK: Perform a high-level Preflight & QA check for iteration #${iterationCount}.
    
    CRITICAL CHECKS:
    - Brand Compliance (Colors, Fonts)
    - Legibility (Contrast, Type Sizes)
    - CTA Clarity (2nd most prominent element)
    - Prepress/Safe Zones (Bleed usage)

    INPUTS:
    BrandKit: ${JSON.stringify(brand)}
    Campaign: ${JSON.stringify(campaign)}
    Design JSON: ${JSON.stringify(currentDesign)}
    SVG Code: ${currentSvg}

    OUTPUT FORMAT: JSON
    Schema:
    {
      "score": number,
      "issues": ["issue1", ...],
      "fixes_applied": ["fix1", ...],
      "is_perfect": boolean,
      "revised_design_json": { ... },
      "revised_svg_code": "...",
      "production_notes": "Updated notes"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text);
};
