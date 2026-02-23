
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateInputsAndAskQuestions, forgeStrategyAndConcepts } from './geminiService';

// Mocking the @google/genai library
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  const GoogleGenAI = vi.fn().mockImplementation(function() {
    return {
      models: {
        generateContent: mockGenerateContent
      }
    };
  });
  return { GoogleGenAI };
});

import { GoogleGenAI } from '@google/genai';

describe('geminiService', () => {
  const brandMock = {
    brand_name: "Test Brand",
    colors: { primary: "#000", secondary: "#fff", white: "#fff", cream: "#fff", neutrals: [] },
    fonts: { display_font: "Serif", body_font: "Sans" }
  } as any;

  const campaignMock = {
    target_platforms: ["print_letter"],
    cta_text: "Click here"
  } as any;

  const assetsMock = { photos: [], product_shots: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validateInputsAndAskQuestions should call generateContent with correct model', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ questions: [] })
    });

    (GoogleGenAI as any).mockImplementation(function() {
        return {
            models: { generateContent: mockGenerateContent }
        };
    });

    await validateInputsAndAskQuestions(brandMock, campaignMock);

    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.0-flash'
    }));
  });

  it('forgeStrategyAndConcepts should include brand and campaign in prompt', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ strategy: [], concepts: [], winner_selection: { id: 'A' } })
    });

    (GoogleGenAI as any).mockImplementation(function() {
        return {
            models: { generateContent: mockGenerateContent }
        };
    });

    await forgeStrategyAndConcepts(brandMock, campaignMock, assetsMock);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toContain('Test Brand');
    expect(callArgs.contents).toContain('print_letter');
  });
});
