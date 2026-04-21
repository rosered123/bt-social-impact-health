import type { ImageSourcePropType } from 'react-native';

const ASSET_MAP: Record<string, ImageSourcePropType> = {
  'brookies for bros.jpg': require('../assets/images/pics/brookies for bros.jpg'),
  'chloe nyugen pfp.jpg': require('../assets/images/pics/chloe nyugen pfp.jpg'),
  'cornucopia vegan night.jpg': require('../assets/images/pics/cornucopia vegan night.jpg'),
  'dannys noodles.png': require('../assets/images/pics/dannys noodles.png'),
  'domain popup.jpg': require('../assets/images/pics/domain popup.jpg'),
  'donuts and coffee 5k.jpg': require('../assets/images/pics/donuts and coffee 5k.jpg'),
  'handmade noodles pfp.jpg': require('../assets/images/pics/handmade noodles pfp.jpg'),
  'julie roberts pfp.jpg': require('../assets/images/pics/julie roberts pfp.jpg'),
  'julie roberts review pic.jpg': require('../assets/images/pics/julie roberts review pic.jpg'),
  'koya background pic.jpg': require('../assets/images/pics/koya background pic.jpg'),
  'koya.png': require('../assets/images/pics/koya.png'),
  'mango matcha smoothie.jpg': require('../assets/images/pics/mango matcha smoothie.jpg'),
  'matcha chiffon cake.jpg': require('../assets/images/pics/matcha chiffon cake.jpg'),
  'matcha coconut macaroons.jpg': require('../assets/images/pics/matcha coconut macaroons.jpg'),
  'matcha green tea latte.jpg': require('../assets/images/pics/matcha green tea latte.jpg'),
  'matcha mochi bites.jpg': require('../assets/images/pics/matcha mochi bites.jpg'),
  'matcha monday pop up picture.png': require('../assets/images/pics/matcha monday pop up picture.png'),
  'matcha monday popup event pic.jpg': require('../assets/images/pics/matcha monday popup event pic.jpg'),
  'matcha monday sessions.png': require('../assets/images/pics/matcha monday sessions.png'),
  'matcha monday.jpg': require('../assets/images/pics/matcha monday.jpg'),
  'matthew smith pfp.jpg': require('../assets/images/pics/matthew smith pfp.jpg'),
  'mike rodriguez pfp.jpg': require('../assets/images/pics/mike rodriguez pfp.jpg'),
  'pizza @ atx.png': require('../assets/images/pics/pizza @ atx.png'),
  'ramen apartment kitchen pfp.jpg': require('../assets/images/pics/ramen apartment kitchen pfp.jpg'),
  'sarah chen pfp.jpg': require('../assets/images/pics/sarah chen pfp.jpg'),
  'sarah chen review pic 2.jpg': require('../assets/images/pics/sarah chen review pic 2.jpg'),
  'sarah chen review pic.jpg': require('../assets/images/pics/sarah chen review pic.jpg'),
  'strawberry matcha parfait.jpg': require('../assets/images/pics/strawberry matcha parfait.jpg'),
  'taco tuesday fiesta.jpg': require('../assets/images/pics/taco tuesday fiesta.jpg'),
  'user pfp.png': require('../assets/images/pics/user pfp.png'),
};

export function imageSource(url?: string | null): ImageSourcePropType | undefined {
  if (!url) return undefined;
  if (/^(https?:|file:|data:|asset:)/i.test(url)) return { uri: url };
  const name = url.split('/').pop() ?? url;
  return ASSET_MAP[name] ?? { uri: url };
}
