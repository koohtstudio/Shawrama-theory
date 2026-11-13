export type TemplateVars = {
  first_name: string;
  order_no: string;
  pickup_time: string;
  total: string;
  items: string;
  status_url: string;
};

export const SAMPLE_VARS: TemplateVars = {
  first_name: "Priya",
  order_no: "1048",
  pickup_time: "6:30 pm",
  total: "$35.47",
  items: "2 x Chicken Shawarma Saj Wrap\n1 x Falafel, 4 pieces",
  status_url: "https://example.com/order/preview",
};

export function renderTemplate(text: string, vars: TemplateVars): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (k in vars ? vars[k as keyof TemplateVars] : m));
}
