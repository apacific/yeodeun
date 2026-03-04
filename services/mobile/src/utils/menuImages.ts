import { ImageSourcePropType } from 'react-native';

const placeholder = require('../../assets/img/store-front.png');

const menuImageOverrides: Record<string, ImageSourcePropType> = {
  'apple-carrot juice': require('../../assets/img/menu/apple-carrot-juice.jpg'),
  'baby bok choy': require('../../assets/img/menu/baby-bok-choy.jpg'),
  'bean sprouts': require('../../assets/img/menu/bean-sprouts.jpg'),
  'bean thread noodles': require('../../assets/img/menu/bean-thread-noodles.jpg'),
  'black bean noodles': require('../../assets/img/menu/black-bean-noodles.jpg'),
  'blackberries': require('../../assets/img/menu/blackberries.jpg'),
  'blackened salmon filet': require('../../assets/img/menu/blackened-salmon.jpg'),
  'braised greens': require('../../assets/img/menu/braised-greens.jpg'),
  'brown gravy': require('../../assets/img/menu/brown-gravy.jpg'),
  'chili garlic peas': require('../../assets/img/menu/chili-garlic-peas.jpg'),
  'chocolate oatmilk': require('../../assets/img/menu/chocolate-oatmilk.jpg'),
  'chopped peanuts': require('../../assets/img/menu/chopped-peanuts.jpg'),
  'cilantro': require('../../assets/img/menu/cilantro.jpg'),
  'cilantro vinaigrette': require('../../assets/img/menu/cilantro-vinaigrette.jpg'),
  'crispy potatoes': require('../../assets/img/menu/crispy-potatoes.jpg'),
  'fried rice': require('../../assets/img/menu/fried-rice.jpg'),
  'fried tofu': require('../../assets/img/menu/fried-tofu.jpg'),
  'glazed carrots': require('../../assets/img/menu/glazed-carrots.jpg'),
  'gochujang': require('../../assets/img/menu/gochujang.jpg'),
  'green grapes': require('../../assets/img/menu/green-grapes.jpg'),
  'green onion': require('../../assets/img/menu/green-onion.jpg'),
  'grilled beef': require('../../assets/img/menu/grilled-beef.jpg'),
  'grilled chicken': require('../../assets/img/menu/grilled-chicken.jpg'),
  'grilled lamb': require('../../assets/img/menu/grilled-lamb.jpg'),
  'grilled octopus': require('../../assets/img/menu/grilled-octopus.jpg'),
  'grilled prawns': require('../../assets/img/menu/grilled-prawns.jpg'),
  'grilled squid': require('../../assets/img/menu/grilled-squid.jpg'),
  'grilled tofu': require('../../assets/img/menu/grilled-tofu.jpg'),
  'hot pepper sauce': require('../../assets/img/menu/hot-pepper-sauce.jpg'),
  'hot tea': require('../../assets/img/menu/hot-tea.jpg'),
  'iced tea': require('../../assets/img/menu/iced-tea.jpg'),
  'kimchi': require('../../assets/img/menu/kimchi.jpg'),
  'mandarin oranges': require('../../assets/img/menu/mandarin-oranges.jpg'),
  'peanut sauce': require('../../assets/img/menu/peanut-sauce.jpg'),
  'pork belly': require('../../assets/img/menu/pork-belly.jpg'),
  'pulled jackfruit': require('../../assets/img/menu/pulled-jackfruit.jpg'),
  'radish sprouts': require('../../assets/img/menu/radish-sprouts.jpg'),
  'roasted broccoli': require('../../assets/img/menu/roasted-broccoli.jpg'),
  'roasted kale': require('../../assets/img/menu/roasted-kale.jpg'),
  'seitan': require('../../assets/img/menu/seitan.jpg'),
  'sesame miso dressing': require('../../assets/img/menu/sesame-miso-dressing.jpg'),
  'shishito peppers': require('../../assets/img/menu/shishito-peppers.jpg'),
  'sliced banana': require('../../assets/img/menu/sliced-banana.jpg'),
  'sliced pear': require('../../assets/img/menu/sliced-pear.jpg'),
  'soy ginger sauce': require('../../assets/img/menu/soy-ginger-sauce.jpg'),
  'sparkling water': require('../../assets/img/menu/sparkling-water.jpg'),
  'steamed rice': require('../../assets/img/menu/steamed-rice.jpg'),
  'stuffed field roast': require('../../assets/img/menu/stuffed-field-roast.jpg'),
  'vegan sausage': require('../../assets/img/menu/vegan-sausage.jpg'),
  'water': require('../../assets/img/menu/water.jpg'),
  'yellow curry sauce': require('../../assets/img/menu/yellow-curry-sauce.jpg'),
};


const galleryExtras: ImageSourcePropType[] = [
  require('../../assets/img/menu/itaewon_night.jpg'),
];

/**
 * Get menu item image.
 */
export const getMenuItemImage = (name: string): ImageSourcePropType =>
  menuImageOverrides[name.toLowerCase()] ?? placeholder;


/**
 * Menu gallery images.
 */
export const menuGalleryImages: ImageSourcePropType[] = [
  ...Object.values(menuImageOverrides),
  ...galleryExtras,
];

