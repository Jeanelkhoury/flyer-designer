
export interface BrandKit {
  brand_name: string;
  website: string;
  logo_assets: { id: string; type: "svg" | "png"; notes: string }[];
  fonts: { display_font: string; body_font: string };
  colors: { primary: string; secondary: string; white: string; cream: string; neutrals: string[] };
  tagline: string;
  values: string[];
  tone_keywords: string[];
  aesthetic_keywords: string[];
  do_not_use: string[];
  image_style_notes: string;
}

export interface Campaign {
  campaign_type: "catering" | "rewards" | "gift_cards" | "ordering" | "seasonal" | "hiring" | "location" | "other";
  headline: string;
  subhead: string;
  body_copy: string;
  offer_details: { price: string; bundle: string; promo_code: string; expires_on: string; fine_print: string };
  cta_text: string;
  cta_url_or_qr_target: string;
  location_block: { name: string; address: string; phone: string; hours: string; extra: string };
  required_elements: string[];
  target_platforms: ("print_letter" | "print_a4" | "instagram_post" | "instagram_story" | "facebook_post" | "web_banner")[];
  output_format: "svg" | "html_css" | "json_only";
  language: string;
}

export interface Assets {
  photos: { id: string; type: "jpg" | "png"; notes: string }[];
  product_shots: { id: string; type: "jpg" | "png"; notes: string }[];
}

export interface DesignJSON {
  document: { size: string; orientation: string; units: string; dpi: number; bleed: number; safe_margin: number };
  grid: { columns: number; gutter: number; baseline: number };
  tokens: { colors: Record<string, string>; type_scale: Record<string, number>; spacing_scale: Record<string, number> };
  layers: {
    id: string;
    type: "rect" | "image" | "text" | "logo" | "qr" | "shape";
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number;
    opacity?: number;
    fill?: string;
    stroke?: string;
    text?: string;
    font?: string;
    size?: number;
    line_height?: number;
    tracking?: number;
    align?: "left" | "center" | "right";
    weight?: string;
  }[];
  asset_slots: { logo_slot: string; photo_slots: string[]; qr_slot?: string };
}

export interface QAReport {
  score: number;
  issues: string[];
  fixes_applied: string[];
  iteration: number;
  is_perfect: boolean;
}

export interface ForgeProcess {
  strategy?: string[];
  concepts?: { id: string; title: string; desc: string; layout: string }[];
  winner?: string;
  history: { design: DesignJSON; artifact: string; qa: QAReport }[];
}
