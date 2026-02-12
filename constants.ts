
import { BrandKit, Campaign, Assets } from './types';

export const LA_MARSA_DEFAULTS: BrandKit = {
  brand_name: "La Marsa Mediterranean Cuisine",
  website: "https://lamarsacuisine.com/",
  logo_assets: [{ id: "main-logo", type: "svg", notes: "Classic scripted logo" }],
  fonts: { display_font: "DM Serif Display", body_font: "Roboto" },
  colors: {
    primary: "#3C9357",
    secondary: "#670E20",
    white: "#FFFFFF",
    cream: "#F9F7F2",
    neutrals: ["#2D2D2D", "#666666", "#E5E5E5"]
  },
  tagline: "At La Marsa, we fuse traditional Mediterranean flavors with healthy, fresh ingredients and impeccable customer service.",
  values: ["Fresh & Healthy Ingredients", "Authentic Flavors", "Mediterranean Hospitality", "Community Involvement"],
  tone_keywords: ["welcoming", "authentic", "warm", "proud"],
  aesthetic_keywords: ["modern-rustic", "authentic", "warm", "mediterranean", "sophisticated"],
  do_not_use: ["neon colors", "more than 2 font families", "low-contrast body text", "overcrowded layouts", "clipart/cheap effects"],
  image_style_notes: "Warm, natural lighting, fresh herbs, close-up food textures."
};

export const INITIAL_CAMPAIGN: Campaign = {
  campaign_type: "catering",
  headline: "Celebrate with Mediterranean Flavor",
  subhead: "Professional Catering for Every Occasion",
  body_copy: "From intimate gatherings to large corporate events, La Marsa brings the authentic taste of the Mediterranean to your table. Fresh, healthy, and unforgettable.",
  offer_details: {
    price: "10% OFF",
    bundle: "Orders over $200",
    promo_code: "MARSA10",
    expires_on: "Dec 31, 2024",
    fine_print: "Valid for first-time catering orders only. Cannot be combined with other offers."
  },
  cta_text: "Order Catering Now",
  cta_url_or_qr_target: "https://lamarsacuisine.com/catering",
  location_block: {
    name: "La Marsa West Bloomfield",
    address: "6215 Orchard Lake Rd, West Bloomfield Township, MI 48322",
    phone: "(248) 539-5900",
    hours: "11AM - 10PM Daily",
    extra: "Available for delivery & pickup"
  },
  required_elements: ["Logo", "Catering Promo Code", "Address Block"],
  target_platforms: ["print_letter"],
  output_format: "svg",
  language: "English"
};

export const EMPTY_ASSETS: Assets = {
  photos: [],
  product_shots: []
};
