// Maps menu item names to their image files.
//
// Items that differ only by size (e.g., Small/Medium/Large) share the same
// image, so we key by name rather than by id. Lookup is case-insensitive
// and tolerant of extra whitespace.
//
// To add a new menu item image:
//   1. Drop the file in src/assets/menu/
//   2. Add an `import` line and an entry to the IMAGE_MAP below
//
// If a menu item has no matching image, getMenuImage() returns null and the
// MenuView template will simply not render an <img> tag for that card.

import blackTea from './assets/menu/black-tea.png';
import cappuccino from './assets/menu/cappuccino.png';
import chai from './assets/menu/chai.png';
import classicCoffee from './assets/menu/classic-coffee.png';
import greenTea from './assets/menu/green-tea.png';
import herbalTea from './assets/menu/herbal-tea.png';
import hotChocolate from './assets/menu/hot-chocolate.png';
import icedCoffee from './assets/menu/iced-coffee.png';
import latte from './assets/menu/latte.png';

const IMAGE_MAP = {
  "uncle joe's black tea": blackTea,
  "uncle joe's cappuccino": cappuccino,
  "uncle joe's chai latte": chai,
  "uncle joe's classic coffee": classicCoffee,
  "uncle joe's green tea": greenTea,
  "uncle joe's herbal tea": herbalTea,
  "uncle joe's hot chocolate": hotChocolate,
  "uncle joe's iced coffee": icedCoffee,
  "uncle joe's latte": latte,
  // Mocha shares the latte image as a sensible visual fallback until a
  // dedicated mocha photo is added. Replace this with a mocha import when
  // the image is available.
  "uncle joe's mocha": latte
};

export function getMenuImage(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return IMAGE_MAP[key] || null;
}
