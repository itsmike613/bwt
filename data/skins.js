const skins = [
  { id: 'plain', name: 'Plain', file: './asset/skin/plain.png' },
  { id: 'red', name: 'Red', file: './asset/skin/red.png' },
  { id: 'blue', name: 'Blue', file: './asset/skin/blue.png' }
];

function skin(id) {
  return skins.find(item => item.id === id) ?? skins[0];
}

export { skin, skins };
