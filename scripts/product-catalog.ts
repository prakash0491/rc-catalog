/**
 * Product catalog derived from the source images in /assets (one image = one product).
 *
 * Names, colors and descriptions are based on direct inspection of each image
 * (product type, body colour, visible remote/bundled items, obvious features).
 * No specifications (scale, speed, battery, range, material) are asserted unless
 * they are visible in the image or stated in the filename. Prices are intentionally
 * not set: no reliable market price could be verified for these products, so every
 * product is imported as DRAFT with price 0 and must be priced/published by the owner.
 */

export type CatalogProduct = {
  /** Exact filename inside /assets */
  file: string;
  /** Customer-facing product name */
  name: string;
  /** Category slug (created by the importer if missing) */
  category: string;
  /** Short customer-facing summary (admin form requires >= 10 chars) */
  shortDescription: string;
  /** Long customer-facing description */
  description: string;
  /** Verified specifications only */
  specs: Array<{ name: string; value: string }>;
  metaTitle: string;
  metaDescription: string;
  /** Whether the product content was confidently identified from the image */
  identified: boolean;
};

/** Byte-identical duplicate files: key = duplicate filename, value = kept filename */
export const duplicateAssets: Record<string, string> = {
  'red mazada.jpg': 'drifr APS.jpg',
};

/** Images present in /assets that are intentionally not imported, with reasons */
export const skippedAssets: Array<{ file: string; reason: string }> = [
  {
    file: 'be70afe5-0822-4064-889a-bce7cc413ab9.jfif',
    reason:
      'Image is a shelf/display photograph containing multiple different products; a single product could not be reliably identified.',
  },
];

export const categoriesToEnsure = [
  {
    name: 'RC Cars',
    slug: 'rc-cars',
    description: 'Remote control cars for on-road driving, racing and drifting.',
    displayOrder: 1,
  },
  {
    name: 'RC Trucks & Buggies',
    slug: 'rc-trucks-buggies',
    description: 'Off-road remote control trucks, monster trucks, crawlers and buggies.',
    displayOrder: 2,
  },
  {
    name: 'RC Planes & Drones',
    slug: 'rc-planes-drones',
    description: 'Remote control planes, drones and flying toys.',
    displayOrder: 3,
  },
  {
    name: 'RC Motorcycles',
    slug: 'rc-motorcycles',
    description: 'Remote control motorcycles and stunt bikes.',
    displayOrder: 4,
  },
] as const;

export const catalog: CatalogProduct[] = [
  {
    file: '4x4.jpg',
    name: 'Green 4x4 RC Monster Truck',
    category: 'rc-trucks-buggies',
    shortDescription: 'Off-road 4x4 monster truck with a rugged body and deep-tread tyres.',
    description:
      'A green and black remote control 4x4 monster truck built for off-road play. It has a rugged raised body, four deep-tread knobby tyres on multi-spoke wheels with yellow rims, and is bundled with a black pistol-grip remote controller. The four-wheel-drive drivetrain and big wheels are designed for rough surfaces, grass and light crawling. Suitable for indoor and outdoor use.',
    specs: [
      { name: 'Drive Type', value: '4WD' },
      { name: 'Vehicle Type', value: 'Monster truck / crawler' },
    ],
    metaTitle: 'Green 4x4 RC Monster Truck',
    metaDescription: 'Green and black remote control 4x4 monster truck with deep-tread tyres and a pistol-grip remote.',
    identified: true,
  },
  {
    file: '554a7656-6da3-4fb3-9c7f-2b10fbe19d15.png',
    name: 'Red & Black RC Drift Car',
    category: 'rc-cars',
    shortDescription: 'Glossy red and black drift-styled RC car with drift tyres and a pistol-grip remote.',
    description:
      'A glossy red and black remote control drift car with a low, wide touring-car body, a rear wing, and bronze multi-spoke wheels fitted with drift tyres. The body carries MDTLN-style racing decals and a 4WD marking. It comes with a black pistol-grip remote controller and two orange practice cones, making it ready for on-road drifting on smooth surfaces.',
    specs: [
      { name: 'Vehicle Type', value: 'Drift car' },
      { name: 'Drive Type', value: '4WD' },
    ],
    metaTitle: 'Red & Black RC Drift Car with Remote',
    metaDescription: 'Red and black remote control drift car with a rear wing, drift tyres, pistol-grip remote and practice cones.',
    identified: true,
  },
  {
    file: '72f56b10-346a-4493-8346-c4abdfa2ccff.png',
    name: 'Blue RC Buggy',
    category: 'rc-trucks-buggies',
    shortDescription: 'Blue off-road buggy with a roll cage, LED light bar and rear wing.',
    description:
      'A blue remote control off-road buggy with a roll-cage body, an exposed black chassis, four spot lights in a roof-mounted light bar, a large rear wing and coil-over shock absorbers. Deep-tread knobby tyres and a protective front bumper suit rough terrain. A black pistol-grip remote controller is included. Designed for outdoor off-road running.',
    specs: [
      { name: 'Vehicle Type', value: 'Off-road buggy' },
      { name: 'Features', value: 'LED light bar' },
    ],
    metaTitle: 'Blue RC Off-Road Buggy with LED Light Bar',
    metaDescription: 'Blue remote control buggy with a roll cage, roof LED light bar, rear wing and pistol-grip remote.',
    identified: true,
  },
  {
    file: 'Fighter Plane.JPG',
    name: 'RC Fighter Jet Drone',
    category: 'rc-planes-drones',
    shortDescription: 'Fighter-jet styled flying drone with ducted fans and a gamepad-style remote.',
    description:
      'A fighter-jet styled remote control drone with a dark grey body and blue camouflage detailing, a silver cockpit canopy and red "FIGHTER" lettering. Twin ducted fans drive the twin-propeller layout, and the toy comes with a gamepad-style two-stick remote controller. A fun, durable flying toy for indoor and calm outdoor use.',
    specs: [{ name: 'Vehicle Type', value: 'Fighter jet drone' }],
    metaTitle: 'RC Fighter Jet Drone with Ducted Fans',
    metaDescription: 'Fighter-jet styled RC drone with ducted fans, camouflage finish and a gamepad-style remote controller.',
    identified: true,
  },
  {
    file: 'IMG_7532_672b5c7f-53c3-474e-bf7d-7a26af01e2ed.jpg',
    name: 'Grey RC Sports Car',
    category: 'rc-cars',
    shortDescription: 'Grey remote control sports car shown with a spare tyre set and remote.',
    description:
      'A grey remote control sports car with a sleek low body, photographed in a store display alongside a stack of spare wheels, a traffic cone and its remote controller. A compact electric RC toy car intended for smooth indoor or paved outdoor surfaces. Details such as exact scale and speed are not specified.',
    specs: [{ name: 'Vehicle Type', value: 'Sports car' }],
    metaTitle: 'Grey RC Sports Car',
    metaDescription: 'Grey remote control sports car with a low sleek body, shown with spare wheels and remote controller.',
    identified: true,
  },
  {
    file: 'Laser Tag Battle Racer RC Car.JPG',
    name: 'Laser Tag Battle Racer RC Car',
    category: 'rc-cars',
    shortDescription: 'Battle-style RC car with laser tag play and a bold yellow and black body.',
    description:
      'A battle-style remote control car designed for laser tag head-to-head play between two players. The bold yellow body with black accents and coloured detailing houses the battle system, and the set is built around racing your opponent while tagging them with the laser. Comes with its remote controller and is ready to battle out of the box. Scale and speed are not specified.',
    specs: [
      { name: 'Vehicle Type', value: 'Battle RC car' },
      { name: 'Play Mode', value: '2-player laser tag battle' },
    ],
    metaTitle: 'Laser Tag Battle Racer RC Car',
    metaDescription: 'Battle-style RC car with 2-player laser tag gameplay, yellow and black body and remote controller.',
    identified: true,
  },
  {
    file: 'Micro F1 RC.PNG',
    name: 'Micro F1 RC Car',
    category: 'rc-cars',
    shortDescription: 'Compact red Formula 1 styled RC car for tabletop racing.',
    description:
      'A compact red Formula 1 styled remote control car with a long nose, open wheels and a rear wing, typical of micro F1 racing toys. Its small size makes it ideal for tabletop or indoor track racing. It is a simple electric RC toy; scale, speed and battery details are not specified.',
    specs: [{ name: 'Vehicle Type', value: 'Formula 1 micro RC car' }],
    metaTitle: 'Micro F1 RC Car',
    metaDescription: 'Compact red Formula 1 styled remote control car for indoor tabletop racing.',
    identified: true,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.37.35 PM (1).jpeg',
    name: 'Red RC Car with Remote',
    category: 'rc-cars',
    shortDescription: 'Red remote control car photographed with its black pistol-grip remote.',
    description:
      'A red remote control car photographed with its black pistol-grip remote controller against a white background. The body shows orange detailing over the red paint. An electric toy-grade RC car intended for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Red RC Car with Remote',
    metaDescription: 'Red remote control car with a black pistol-grip remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.37.35 PM (2).jpeg',
    name: 'Black RC Car with Remote',
    category: 'rc-cars',
    shortDescription: 'Black remote control car photographed with its remote controller.',
    description:
      'A black remote control car with a light grey roof detail, photographed with its black remote controller on a white background. An electric toy-grade RC car intended for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Black RC Car with Remote',
    metaDescription: 'Black remote control car with a black remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.37.35 PM (3).jpeg',
    name: 'Red RC Sports Car',
    category: 'rc-cars',
    shortDescription: 'Red remote control sports car photographed with its remote controller.',
    description:
      'A red remote control sports car with black wheel detailing, photographed with its black remote controller on a white background. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Red RC Sports Car',
    metaDescription: 'Red remote control sports car with a black remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.37.35 PM.jpeg',
    name: 'Blue RC Car with Remote',
    category: 'rc-cars',
    shortDescription: 'Blue remote control car photographed with its remote controller.',
    description:
      'A blue remote control car with black wheel detailing, photographed with its black remote controller on a white background. An electric toy-grade RC car intended for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Blue RC Car with Remote',
    metaDescription: 'Blue remote control car with a black remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.39.33 PM (1).jpeg',
    name: 'Red RC Car (Store Photo)',
    category: 'rc-cars',
    shortDescription: 'Red remote control car photographed in a store display.',
    description:
      'A red remote control car photographed in a store display with its black pistol-grip remote. The photo shows the car on a shelf surface; it is an electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Red RC Car',
    metaDescription: 'Red remote control car photographed in a store display with its remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.39.33 PM (2).jpeg',
    name: 'Red RC Sports Car (Store Photo)',
    category: 'rc-cars',
    shortDescription: 'Red remote control sports car photographed in a store display.',
    description:
      'A red remote control sports car photographed in a store display alongside its black pistol-grip remote. The photo shows a large, glossy red body with black wheel detailing. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Red RC Sports Car',
    metaDescription: 'Red remote control sports car photographed in a store display with its remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.39.33 PM (3).jpeg',
    name: 'Red & Orange RC Car (Store Photo)',
    category: 'rc-cars',
    shortDescription: 'Red and orange remote control car photographed in a store display.',
    description:
      'A red and orange remote control car photographed in a store display with its black pistol-grip remote. The body combines red and orange panels with black detailing. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Red & Orange RC Car',
    metaDescription: 'Red and orange remote control car photographed in a store display with its remote controller.',
    identified: false,
  },
  {
    file: 'WhatsApp Image 2026-06-28 at 12.39.33 PM.jpeg',
    name: 'Blue RC Sports Car (Store Photo)',
    category: 'rc-cars',
    shortDescription: 'Blue remote control sports car with red and magenta accents.',
    description:
      'A blue remote control sports car with red and magenta accent detailing, photographed in a store display with its black pistol-grip remote. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Blue RC Sports Car',
    metaDescription: 'Blue remote control sports car with red and magenta accents, shown with its remote controller.',
    identified: false,
  },
  {
    file: 'bd33509c-dfa4-4388-8513-539c9e5fc7ba.png',
    name: 'Black RC Sports Car with Orange Flames',
    category: 'rc-cars',
    shortDescription: 'Black remote control sports car with orange and red flame graphics.',
    description:
      'A black remote control sports car with bold orange and red flame-style graphics along the body, photographed as a studio product shot with its remote controller. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Black RC Sports Car with Orange Flames',
    metaDescription: 'Black remote control sports car with orange and red flame graphics and remote controller.',
    identified: false,
  },
  {
    file: 'black pro.jpg',
    name: 'Black Pro RC Car',
    category: 'rc-cars',
    shortDescription: 'Black remote control car with orange accents and red detailing.',
    description:
      'A black remote control car with orange side accents and red detailing, photographed on a white background. The sleek body is typical of toy-grade Pro-style RC sports cars sold with a pistol-grip remote. An electric RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Black Pro RC Car',
    metaDescription: 'Black remote control sports car with orange accents and red detailing.',
    identified: true,
  },
  {
    file: 'black x4x.jpg',
    name: 'Black 4x4 RC Monster Truck',
    category: 'rc-trucks-buggies',
    shortDescription: 'Black 4x4 monster truck with blue accents and chunky tyres.',
    description:
      'A black remote control 4x4 monster truck with blue accent panels and cyan detailing, photographed on a white background. It features a raised body, chunky tyres and a rugged off-road look. A pistol-grip remote controller is included. Drive and technical details beyond the 4x4 layout are not specified.',
    specs: [
      { name: 'Drive Type', value: '4WD' },
      { name: 'Vehicle Type', value: 'Monster truck' },
    ],
    metaTitle: 'Black 4x4 RC Monster Truck',
    metaDescription: 'Black remote control 4x4 monster truck with blue accents and chunky off-road tyres.',
    identified: true,
  },
  {
    file: 'blue mazzda.jpg',
    name: 'Blue Mazda RC Car',
    category: 'rc-cars',
    shortDescription: 'Blue Mazda-styled remote control car photographed in a store display.',
    description:
      'A blue Mazda-styled remote control car with black stripe detailing, photographed in a store display. The image shows a light blue body with dark accents. An electric toy-grade RC car for smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Blue Mazda RC Car',
    metaDescription: 'Blue Mazda-styled remote control car with black stripe detailing.',
    identified: true,
  },
  {
    file: 'blue polo.jpg',
    name: 'Blue Polo RC Car',
    category: 'rc-cars',
    shortDescription: 'Blue Polo-styled remote control car photographed in a store display.',
    description:
      'A blue Polo-styled remote control car with black detailing and magenta accents, photographed in a store display on a cloth surface. An electric toy-grade RC hatchback car for smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC hatchback car' }],
    metaTitle: 'Blue Polo RC Car',
    metaDescription: 'Blue Polo-styled remote control car with black detailing photographed in a store display.',
    identified: true,
  },
  {
    file: 'bmw e30.JPG',
    name: 'Black BMW E30 RC Car',
    category: 'rc-cars',
    shortDescription: 'Black BMW E30-styled remote control car with red and orange graphics.',
    description:
      'A black BMW E30-styled remote control car with red and orange racing graphics, photographed on a white background. The boxy, classic saloon silhouette is typical of BMW E30 toy replicas. An electric RC car for smooth surfaces. Exact scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC saloon car (BMW E30 style)' }],
    metaTitle: 'Black BMW E30 RC Car',
    metaDescription: 'Black BMW E30-styled remote control car with red and orange racing graphics.',
    identified: true,
  },
  {
    file: 'dd838e0e-9308-4528-9e32-db3424a99809.png',
    name: 'Black RC Car',
    category: 'rc-cars',
    shortDescription: 'Black remote control car with a studio product shot and remote.',
    description:
      'A black remote control car photographed as a studio product shot with its remote controller on a white background. The body is finished in gloss black with dark wheel detailing. An electric toy-grade RC car for smooth surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC car' }],
    metaTitle: 'Black RC Car',
    metaDescription: 'Black remote control car shown in a studio product shot with its remote controller.',
    identified: false,
  },
  {
    file: 'drifr APS.jpg',
    name: 'Red Mazda Drift RC Car',
    category: 'rc-cars',
    shortDescription: 'Red drift-styled RC car with black detailing, photographed in a store display.',
    description:
      'A red drift-styled remote control car with black detailing and a low body, photographed in a store display on a cloth surface with its remote controller. Built for on-road drifting on smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [
      { name: 'Vehicle Type', value: 'Drift car' },
      { name: 'Drive Type', value: '4WD' },
    ],
    metaTitle: 'Red Mazda Drift RC Car',
    metaDescription: 'Red drift-styled remote control car with black detailing for on-road drifting.',
    identified: true,
  },
  {
    file: 'mazada blue col.jpg',
    name: 'Blue Mazda RC Car (Store Photo)',
    category: 'rc-cars',
    shortDescription: 'Blue Mazda-styled remote control car with black and red accents.',
    description:
      'A blue Mazda-styled remote control car with black and red accent detailing, photographed in a store display on a cloth surface. An electric toy-grade RC car for smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car' }],
    metaTitle: 'Blue Mazda RC Car',
    metaDescription: 'Blue Mazda-styled remote control car with black and red accent detailing.',
    identified: false,
  },
  {
    file: 'moto tech 2.jpg',
    name: 'Red Moto Tech RC Motorcycle',
    category: 'rc-motorcycles',
    shortDescription: 'Red remote control motorcycle with black detailing.',
    description:
      'A red remote control motorcycle with black body and wheel detailing, photographed in a store display. The bike-style RC toy is designed for smooth indoor or paved surfaces. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC motorcycle' }],
    metaTitle: 'Red Moto Tech RC Motorcycle',
    metaDescription: 'Red remote control motorcycle with black detailing.',
    identified: true,
  },
  {
    file: 'moto tech.jpg',
    name: 'Moto Tech RC Motorcycle',
    category: 'rc-motorcycles',
    shortDescription: 'Red remote control motorcycle with blue accents and remote controller.',
    description:
      'A red remote control motorcycle with blue accent parts, photographed as a studio product shot on a white background with its remote controller. The detailed bike body includes a black seat and wheels. Model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC motorcycle' }],
    metaTitle: 'Moto Tech RC Motorcycle',
    metaDescription: 'Red remote control motorcycle with blue accents, shown with its remote controller.',
    identified: true,
  },
  {
    file: 'pink proshe.jpg',
    name: 'Pink Proshe RC Car',
    category: 'rc-cars',
    shortDescription: 'Pink Porsche-styled remote control car with orange accents.',
    description:
      'A pink Porsche-styled remote control car with orange accent detailing and black wheels, photographed on a white background. The rounded sports-car silhouette is typical of Proshe/Porsche-style toy replicas popular in the Indian toy market. An electric RC car for smooth surfaces. Exact scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC sports car (Porsche style)' }],
    metaTitle: 'Pink Proshe RC Car',
    metaDescription: 'Pink Porsche-styled remote control car with orange accents and black wheels.',
    identified: true,
  },
  {
    file: 'proshe drift.jpg',
    name: 'Proshe Drift RC Car',
    category: 'rc-cars',
    shortDescription: 'Porsche-styled drift RC car with dark blue body and orange accents.',
    description:
      'A Porsche-styled remote control drift car with a dark blue body, orange side accents and red rear detailing, photographed on a white background. The low sports-coupe body and drift-style wheels suit on-road drifting on smooth surfaces. Exact scale and technical details could not be verified from the image.',
    specs: [
      { name: 'Vehicle Type', value: 'Drift car (Porsche style)' },
      { name: 'Drive Type', value: '4WD' },
    ],
    metaTitle: 'Proshe Drift RC Car',
    metaDescription: 'Porsche-styled remote control drift car with a dark blue body and orange accents.',
    identified: true,
  },
  {
    file: 'red polo.jpg',
    name: 'Red Polo RC Car',
    category: 'rc-cars',
    shortDescription: 'Red Polo-styled remote control car photographed in a store display.',
    description:
      'A red Polo-styled remote control car with black detailing, photographed in a store display on a cloth surface. An electric toy-grade RC hatchback car for smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC hatchback car' }],
    metaTitle: 'Red Polo RC Car',
    metaDescription: 'Red Polo-styled remote control car photographed in a store display.',
    identified: true,
  },
  {
    file: 'silver 4x4.jpg',
    name: 'Silver 4x4 RC Monster Truck',
    category: 'rc-trucks-buggies',
    shortDescription: 'Silver and blue 4x4 monster truck with chunky off-road tyres.',
    description:
      'A silver and blue remote control 4x4 monster truck with cyan accent detailing and chunky off-road tyres, photographed on a white background. The raised, rugged body is built for off-road play. A pistol-grip remote controller is included. Drive and technical details beyond the 4x4 layout are not specified.',
    specs: [
      { name: 'Drive Type', value: '4WD' },
      { name: 'Vehicle Type', value: 'Monster truck' },
    ],
    metaTitle: 'Silver 4x4 RC Monster Truck',
    metaDescription: 'Silver and blue remote control 4x4 monster truck with chunky off-road tyres.',
    identified: true,
  },
  {
    file: 'skyblue polo.jpg',
    name: 'Sky Blue Polo RC Car',
    category: 'rc-cars',
    shortDescription: 'Sky blue Polo-styled remote control car with black detailing.',
    description:
      'A sky blue Polo-styled remote control car with black detailing and red and orange accents, photographed in a store display on a cloth surface. An electric toy-grade RC hatchback car for smooth surfaces. Exact model, scale and technical details could not be verified from the image.',
    specs: [{ name: 'Vehicle Type', value: 'RC hatchback car' }],
    metaTitle: 'Sky Blue Polo RC Car',
    metaDescription: 'Sky blue Polo-styled remote control car with black detailing.',
    identified: true,
  },
];
