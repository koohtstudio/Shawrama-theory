// Brand copy that does not change with the menu. Edit here.
export const SITE = {
  name: "Shawarma Theory",
  tagline: "Made with passion. Proven by taste.",
  description:
    "Saj bread baked fresh in-house, chicken marinated for 24 hours, every sauce made from scratch. Pickup, dine in or delivery at 510 Bayfield St, Barrie.",
};

export const THEORY = [
  {
    n: "01",
    title: "The bread",
    body: "Our saj is baked fresh in-house, thin and soft with a little char. It's the whole reason the wrap holds together.",
    photo: "/photos/saj-in-the-making.jpg",
    alt: "Fresh saj bread being made in the kitchen",
  },
  {
    n: "02",
    title: "The marinade",
    body: "Locally sourced chicken marinated for 24 hours, then grilled to order. Beef and lamb joins it on Fridays and Sundays.",
    photo: "/photos/beef-lamb-spit.jpg",
    alt: "Beef and lamb shawarma turning on the spit",
  },
  {
    n: "03",
    title: "The sauces",
    body: "Garlic, amba, house hot sauce, red pepper walnut. All made from scratch, all worth asking for extra.",
    photo: "/photos/red-pepper-walnut.jpg",
    alt: "Red pepper walnut spread topped with walnuts",
  },
] as const;

export const HOUSE_SAUCES = ["Garlic", "Amba", "House hot sauce", "Red pepper walnut", "Fattoush dressing"];
export const MARQUEE = ["Saj baked daily", "Garlic sauce", "Amba", "House hot sauce", "24 hour marinade", "Falafel"];
export const TICKER = [
  "Saj bread baked fresh in-house",
  "Beef and lamb shawarma Fridays and Sundays",
  "Chicken marinated 24 hours",
  "510 Bayfield St, Barrie",
];

export const STRIP: { src: string; alt: string }[] = [
  { src: "/photos/wraps-in-hand.jpg", alt: "Two loaded wraps held up to the camera" },
  { src: "/photos/toppings-bar.jpg", alt: "The toppings bar" },
  { src: "/photos/beef-lamb-spit.jpg", alt: "Beef and lamb on the spit" },
  { src: "/photos/spread-table.jpg", alt: "A full spread of wraps, dips and salads" },
  { src: "/photos/saj-in-the-making.jpg", alt: "Saj in the making" },
  { src: "/photos/over-hummus-bowls.jpg", alt: "Hummus bowls with cauliflower and shawarma" },
  { src: "/photos/storefront-day.jpg", alt: "The shop on Bayfield" },
  { src: "/photos/falafel-fresh.jpg", alt: "Fresh falafel" },
];

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
