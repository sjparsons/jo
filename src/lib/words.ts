const WORDS = [
  'ace', 'age', 'aid', 'aim', 'air', 'ale', 'ant', 'ape', 'arc', 'ark',
  'ash', 'axe', 'bay', 'bed', 'bee', 'bit', 'bog', 'bow', 'box', 'bud',
  'bug', 'bus', 'cab', 'cam', 'cap', 'car', 'cat', 'cob', 'cod', 'cog',
  'cow', 'cub', 'cup', 'cut', 'dam', 'day', 'den', 'dew', 'dig', 'dim',
  'dip', 'doe', 'dog', 'dot', 'dry', 'dug', 'dun', 'dusk', 'ear', 'eel',
  'egg', 'elk', 'elm', 'emu', 'eve', 'ewe', 'eye', 'fan', 'far', 'fawn',
  'fern', 'fig', 'fin', 'fir', 'fit', 'fix', 'fly', 'fog', 'fox', 'fry',
  'fun', 'fur', 'gale', 'gap', 'gas', 'gem', 'gin', 'gnu', 'gum', 'gun',
  'gut', 'guy', 'gym', 'hag', 'ham', 'hat', 'hay', 'hen', 'hex', 'hog',
  'hop', 'hub', 'hue', 'hum', 'ice', 'imp', 'ink', 'inn', 'ion', 'ire',
  'ivy', 'jab', 'jag', 'jam', 'jar', 'jaw', 'jay', 'jet', 'jig', 'job',
  'jog', 'joy', 'jug', 'jut', 'keg', 'ken', 'key', 'kid', 'kin', 'kit',
  'lab', 'lad', 'lag', 'lap', 'lark', 'law', 'lay', 'lea', 'leg', 'lid',
  'lip', 'log', 'lot', 'lug', 'lux', 'lynx', 'map', 'mars', 'mat', 'maw',
  'mix', 'mob', 'mop', 'mud', 'mug', 'nap', 'net', 'nib', 'nod', 'nut',
  'oak', 'oar', 'oat', 'odd', 'oil', 'orb', 'ore', 'otter', 'owl', 'pad',
  'pan', 'paw', 'pea', 'peg', 'pen', 'pet', 'pie', 'pig', 'pin', 'pit',
  'pod', 'pot', 'pry', 'pub', 'pug', 'pun', 'pup', 'rag', 'ram', 'rap',
  'rat', 'raw', 'ray', 'red', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob',
  'rod', 'rot', 'row', 'rub', 'rug', 'rum', 'run', 'rut', 'rye', 'sap',
  'saw', 'shy', 'sin', 'sip', 'ski', 'sky', 'sly', 'sob', 'sod', 'son',
  'sow', 'spy', 'sun', 'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea',
  'ten', 'the', 'tic', 'tie', 'tin', 'tip', 'toe', 'ton', 'top', 'tow',
  'toy', 'tub', 'tug', 'urn', 'van', 'vat', 'vet', 'vim', 'vine', 'vow',
  'wag', 'war', 'wax', 'web', 'wig', 'win', 'wit', 'wok', 'yak', 'yam',
  'yap', 'yaw', 'yew', 'zap', 'zen', 'zip', 'zoo',
]

export function pickName(taken: Set<string>): string | null {
  const available = WORDS.filter((w) => !taken.has(w))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}
