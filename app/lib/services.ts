// Define the Service interface
export interface Service {
  testimonial: any;
  pricing: number;
  id: string;
  title: string;
  img: string;
  desc: string;
}

// Define the services array
export const services: Service[] = [
  {
    id: "ac-repair",
    title: "AC Services & Repair",
    img: "/repairman-doing-air-conditioner-service_1303-26541.avif",
    desc: "Keep your home cool and comfortable with our expert AC repair and maintenance services. We specialize in servicing all types of air conditioners, including window, split, and central units.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "washing-machine-repair",
    title: "Washing Machine Repair",
    img: "/washingmachine.jpg",
    desc: "Restore your washing machine's functionality with our reliable repair services. We handle both front-load and top-load models, addressing issues like drum malfunctions, water leakage, and electrical faults.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "refrigerator-repair",
    title: "Refrigerator Repair",
    img: "/fridge-repair1.jpg",
    desc: "Ensure your food stays fresh with our efficient refrigerator repair and maintenance services. We service all refrigerator types, including single-door, double-door, and side-by-side models.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "geyser-repair",
    title: "Geyser Repair",
    img: "/geyser-repair.jpg",
    desc: "Enjoy safe and consistent hot water with our expert geyser repair services. We repair electric and gas geysers, addressing issues like heating element failures, thermostat malfunctions, and water leakage.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "microwave-repair",
    title: "Microwave Repair",
    img: "/microwave-repair.avif",
    desc: "Get your microwave back to peak performance with our quick and reliable repair services. We fix all types of microwaves, including solo, grill, and convection models.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "ro-water-purifier-repair",
    title: "RO Water Purifier Repair",
    img: "/ro-water.webp",
    desc: "Ensure clean and safe drinking water with our professional RO water purifier repair and maintenance services. We service all RO systems, addressing issues like membrane blockages and filter replacements.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "deep-freezer-repair",
    title: "Deep Freezer Repair",
    img: "/deepfridge.webp",
    desc: "Maintain optimal freezing performance with our professional deep freezer repair services. We service commercial and residential deep freezers, fixing issues like compressor failures and temperature fluctuations.",
    testimonial: null,
    pricing: 599
  },
  {
    id: "chimney-repair",
    title: "Chimney Repair",
    img: "/chimney.webp",
    desc: "Keep your kitchen smoke-free and safe with our efficient chimney repair and maintenance services. We repair all types of kitchen chimneys, addressing issues like motor failures and suction problems.",
    testimonial: null,
    pricing: 599
  }
];

// // Define the Testimonial interface for type safety
// export interface Testimonial {
//   author: string;
//   quote: string;
//   rating: number;
// }

// // Define the Pricing interface for type safety
// export interface Pricing {
//   basePrice: number;
//   additionalFees?: Record<string, number>;
// }

// // Define the Service interface
// export interface Service {
//   id: string;
//   title: string;
//   img: string;
//   desc: string;
//   testimonial?: Testimonial[]; // Optional, with defined type
//   pricing?: Pricing;          // Optional, with defined type
// }

// // Define the services array
// export const services: Service[] = [
//   {
//     id: "ac-repair",
//     title: "AC Services & Repair",
//     img: "/ac-repair.webp",
//     desc: "Keep your home cool with expert AC repair and maintenance for window, split, and central units.",
//     testimonial: [], // Placeholder for future data
//     pricing: { basePrice: 0 }, // Placeholder for future data
//   },
//   {
//     id: "washing-machine-repair",
//     title: "Washing Machine Repair",
//     img: "/washing-machine-repair.webp",
//     desc: "Restore your washing machine's functionality with reliable repairs for front-load and top-load models.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "refrigerator-repair",
//     title: "Refrigerator Repair",
//     img: "/refrigerator-repair.webp",
//     desc: "Ensure fresh food with efficient refrigerator repairs for single-door, double-door, and side-by-side models.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "geyser-repair",
//     title: "Geyser Repair",
//     img: "/geyser-repair.webp",
//     desc: "Enjoy safe, consistent hot water with expert geyser repairs for electric and gas models.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "microwave-repair",
//     title: "Microwave Repair",
//     img: "/microwave-repair.webp",
//     desc: "Get your microwave to peak performance with quick repairs for solo, grill, and convection models.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "ro-water-purifier-repair",
//     title: "RO Water Purifier Repair",
//     img: "/ro-water-purifier-repair.webp",
//     desc: "Ensure clean drinking water with professional RO system repairs and maintenance.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "deep-freezer-repair",
//     title: "Deep Freezer Repair",
//     img: "/deep-freezer-repair.webp",
//     desc: "Maintain optimal freezing with professional repairs for commercial and residential deep freezers.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
//   {
//     id: "chimney-repair",
//     title: "Chimney Repair",
//     img: "/chimney-repair.webp",
//     desc: "Keep your kitchen smoke-free with efficient chimney repairs and maintenance.",
//     testimonial: [],
//     pricing: { basePrice: 0 },
//   },
// ];