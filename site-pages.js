const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-nav');
document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
const closeMenu = () => {
  navigation?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};
menuButton?.addEventListener('click', () => {
  const open = navigation?.classList.toggle('open') || false;
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('click', (event) => {
  if (navigation?.classList.contains('open') && !navigation.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
window.addEventListener('scroll', closeMenu, { passive: true });
document.querySelectorAll('.filter').forEach((filter) => filter.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  document.querySelectorAll('.product-card').forEach((card) => {
    const visible = filter.dataset.filter === 'all' || card.dataset.category === filter.dataset.filter;
    card.classList.toggle('hidden', !visible);
  });
}));
// Персонажи, свёрстанные в каталоге. Цены и имена продублированы в script.ts
// (staticShopProducts) — подстраницы не подключают тот бандл. Меняя здесь, правьте и там.
const CATALOG_PRODUCTS = {
  mia: {
    price: 29,
    ru: {
      name: 'Зайка Мия',
      story: 'Мия появилась на свет тихим утром, когда чайник ещё только собирался закипеть. Её вязали петля за петлёй, и вместе с длинными ушками ей достался характер — любопытный, но очень домашний. У Мии есть собственный NFC-паспорт: прикоснитесь телефоном, и она расскажет, где родилась и что успела запомнить.',
      materials: 'Её шёрстка — мягкий хлопок, тёплый на ощупь. Внутри спрятано облачко гипоаллергенного холлофайбера, поэтому Мия лёгкая и обнимать её удобно. Глазки и носик вышиты нитью, а не пришиты бусинами, — оторвать их не выйдет даже у самых любопытных пальчиков.',
      care: 'Мия любит тёплую ванну, но только руками: вода до 30°, капля мягкого мыла, никакого отбеливателя и стиральной машины. После купания её не выжимают — бережно промакивают полотенцем и оставляют сохнуть лёжа, расправив ушки. Утюга и фена Мия побаивается.',
      note: 'Ручная работа · NFC-паспорт · Подарочная упаковка · Не рекомендуется детям младше 3 лет'
    },
    en: {
      name: 'Mia the Bunny',
      story: 'Mia came into the world on a quiet morning, before the kettle had even thought about boiling. She was crocheted stitch by stitch, and along with her long ears she was given a character — curious, but very much a homebody. Mia carries her own NFC passport: touch it with your phone and she will tell you where she was born and what she remembers.',
      materials: 'Her coat is soft cotton, warm to the touch. Inside hides a little cloud of hypoallergenic hollowfibre, so Mia is light and easy to hug. Her eyes and nose are embroidered with thread rather than sewn-on beads — even the most curious fingers cannot pull them off.',
      care: 'Mia loves a warm bath, but by hand only: water up to 30°, a drop of gentle soap, no bleach and no washing machine. After her bath she is never wrung out — pat her with a towel and leave her to dry flat, ears spread out. Mia is rather afraid of irons and hairdryers.',
      note: 'Handmade · NFC passport · Gift wrapping · Not recommended for children under 3'
    }
  },
  teo: {
    price: 34,
    ru: {
      name: 'Мишка Тео',
      story: 'Тео связали к первым холодам, и с тех пор в его шарфе живёт запах зимнего утра. Он неспешный, обстоятельный и любит сидеть на подоконнике, наблюдая за прохожими. Ростом Тео около 30 сантиметров — как раз чтобы поместиться под мышкой. Его NFC-паспорт хранит первую главу истории, а продолжение впишете вы.',
      materials: 'Тео связан из плотной хлопковой пряжи, поэтому держит форму и не лохматится. Внутри — тот же гипоаллергенный холлофайбер. Шарф вяжется отдельно и снимается, так что его можно постирать отдельно или связать новый. Глаза вышиты нитью.',
      care: 'Купать Тео нужно руками при температуре до 30°, без отбеливателя и без машинной стирки. Отжимать его нельзя — только промокнуть полотенцем и разложить сушиться на ровной поверхности, чтобы он не потерял форму. Шарф сохнет отдельно.',
      note: 'Ручная работа · NFC-паспорт · Съёмный шарф · Не рекомендуется детям младше 3 лет'
    },
    en: {
      name: 'Theo the Bear',
      story: 'Theo was crocheted just before the first cold days, and ever since his scarf has held the smell of a winter morning. He is unhurried, thorough, and likes to sit on the windowsill watching passers-by. Theo stands about 30 centimetres tall — just right to tuck under your arm. His NFC passport holds the first chapter of his story; the rest you will write yourself.',
      materials: 'Theo is made from dense cotton yarn, so he keeps his shape and does not go fluffy. Inside is the same hypoallergenic hollowfibre. His scarf is knitted separately and comes off, so it can be washed on its own or replaced with a new one. His eyes are embroidered with thread.',
      care: 'Theo should be washed by hand at up to 30°, with no bleach and no washing machine. Never wring him out — pat him with a towel and lay him flat to dry so he keeps his shape. The scarf dries separately.',
      note: 'Handmade · NFC passport · Removable scarf · Not recommended for children under 3'
    }
  }
};

const CART_KEY = 'viori-cart';
const modal = document.getElementById('catalogProductModal');
const toast = document.getElementById('cartToast');
let toastTimer = 0;

function catalogLanguage() {
  return localStorage.getItem('viori-language') || 'ru';
}

// Русский — как свёрстано, остальные языки берут английский вариант сказки.
function productCopy(product) {
  return catalogLanguage() === 'ru' ? product.ru : product.en;
}

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

function addToCart(id, quantity) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.quantity += quantity;
  else cart.push({ id, quantity });
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartCount();
}

function showCartToast(name) {
  if (!toast) return;
  const label = catalogLanguage() === 'ru' ? `«${name}» в корзине` : `“${name}” added to the cart`;
  const link = toast.querySelector('.cart-toast-link');
  const text = document.getElementById('cartToastText');
  if (text) text.textContent = label;
  if (link) link.textContent = catalogLanguage() === 'ru' ? 'Перейти в корзину' : 'Open the cart';
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 5000);
}

// Кнопка каталога -> данные товара. Статические персонажи описаны выше,
// товары из Supabase приносят имя и цену прямо в data-атрибутах.
function resolveCatalogProduct(button) {
  const staticKey = button.dataset.staticProduct;
  if (staticKey && CATALOG_PRODUCTS[staticKey]) {
    const product = CATALOG_PRODUCTS[staticKey];
    const copy = productCopy(product);
    return { id: `static:${staticKey}`, price: product.price, ...copy };
  }
  const dbId = button.dataset.dbProduct;
  if (!dbId) return null;
  const ru = catalogLanguage() === 'ru';
  return {
    id: `catalog:${dbId}`,
    price: Number(button.dataset.productPrice || 0),
    name: button.dataset.productName || '',
    story: button.dataset.productDescription || '',
    materials: ru
      ? 'Игрушка связана вручную из хлопковой пряжи с гипоаллергенным наполнителем. Точный состав указывается в описании заказа.'
      : 'Crocheted by hand from cotton yarn with hypoallergenic filling. The exact composition is confirmed with your order.',
    care: ru
      ? 'Ручная стирка при температуре до 30°, без отбеливателя и машинной стирки. Сушить лёжа, не отжимая.'
      : 'Hand wash at up to 30°, no bleach and no washing machine. Dry flat without wringing.',
    note: ru
      ? 'Ручная работа · NFC-паспорт · Не рекомендуется детям младше 3 лет'
      : 'Handmade · NFC passport · Not recommended for children under 3'
  };
}

function openCatalogProduct(product) {
  if (!modal) return;
  const ru = catalogLanguage() === 'ru';
  document.getElementById('catalogProductName').textContent = product.name;
  document.getElementById('catalogProductPrice').textContent = `${ru ? 'от' : 'from'} €${product.price}`;
  document.getElementById('catalogProductStory').textContent = product.story;
  document.getElementById('catalogProductMaterials').textContent = product.materials;
  document.getElementById('catalogProductCare').textContent = product.care;
  document.getElementById('catalogProductNote').textContent = product.note;
  document.getElementById('catalogMaterialsTitle').textContent = ru ? 'Из чего она соткана' : 'What she is made of';
  document.getElementById('catalogCareTitle').textContent = ru ? 'Как её купать' : 'How to bathe her';
  const addButton = document.getElementById('catalogModalAddToCart');
  if (addButton) {
    addButton.textContent = ru ? 'Добавить в корзину' : 'Add to cart';
    addButton.dataset.product = product.id;
    addButton.dataset.productName = product.name;
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('shop-open');
}

function closeCatalogProduct() {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('shop-open');
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('[data-close-catalog-product]')) { closeCatalogProduct(); return; }

  const addFromModal = target.closest('#catalogModalAddToCart');
  if (addFromModal) {
    addToCart(addFromModal.dataset.product || '', 1);
    showCartToast(addFromModal.dataset.productName || '');
    closeCatalogProduct();
    return;
  }

  const button = target.closest('.view-product, .add-to-cart');
  if (!button) return;
  const product = resolveCatalogProduct(button);
  if (!product) return;
  event.preventDefault();
  if (button.classList.contains('view-product')) {
    openCatalogProduct(product);
  } else {
    addToCart(product.id, 1);
    showCartToast(product.name);
  }
});

document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCatalogProduct(); });
async function loadPageCatalog() {
  const grid = document.querySelector('.product-grid');
  const config = window.VIORI_CONFIG;
  if (!grid || !config?.supabaseUrl || !config?.supabaseAnonKey) return;
  try {
    const endpoint = `${config.supabaseUrl}/rest/v1/products?select=id,slug,name_ru,name_en,description_ru,description_en,category,price_cents,is_active,product_images(storage_path)&is_active=eq.true&order=created_at`;
    const response = await fetch(endpoint, { headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` } });
    if (!response.ok) return;
    const products = await response.json();
    if (!products.length) {
      grid.innerHTML = '<div class="toy-empty"><h3>Коллекция готовится</h3><p>Товары появятся после завершения документов по безопасности.</p></div>';
      return;
    }
    const code = localStorage.getItem('viori-language') || 'ru';
    const cardLabels = {
      ru: ['Познакомиться', 'Хочу такую'],
      en: ['Meet the character', 'I want this one'],
      nl: ['Maak kennis', 'Deze wil ik'],
      de: ['Kennenlernen', 'Diese möchte ich'],
      fr: ['Découvrir', 'Je la veux']
    }[code] || ['Meet the character', 'I want this one'];
    const productSelect = document.getElementById('productSelect');
    if (productSelect) productSelect.innerHTML = products.map((product) => `<option>${code === 'ru' ? product.name_ru : product.name_en}</option>`).join('');
    grid.innerHTML = products.map((product) => {
      const name = code === 'ru' ? product.name_ru : product.name_en;
      const description = code === 'ru' ? product.description_ru : product.description_en;
      const path = product.product_images?.[0]?.storage_path;
      const image = path ? `${config.supabaseUrl}/storage/v1/object/public/product-images/${encodeURI(path)}` : '';
      const price = (product.price_cents / 100).toFixed(2);
      const data = `data-db-product="${product.id}" data-product-name="${name}" data-product-price="${price}" data-product-description="${description}"`;
      return `<article class="product-card" data-category="${product.category}"><div class="product-image"${image ? ` style="background-image:url('${image}');background-size:cover;background-position:center"` : ''}></div><div class="product-info"><div><p class="product-type">VIORI</p><h3>${name}</h3></div><p class="price">€${price}</p></div><p class="product-description">${description}</p><div class="card-actions"><button class="card-button view-product" type="button" ${data}>${cardLabels[0]}</button><button class="card-button add-to-cart" type="button" ${data}>${cardLabels[1]}</button></div></article>`;
    }).join('');
  } catch { /* Keep the static fallback when the network is unavailable. */ }
}
void loadPageCatalog();
document.getElementById('orderForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const subject = `Новая заявка VIORI — ${String(data.get('product') || 'особенная игрушка')}`;
  const body = [`Имя: ${data.get('name') || ''}`, `Игрушка: ${data.get('product') || ''}`, `Пожелания: ${data.get('message') || 'не указаны'}`].join('\n');
  location.href = `mailto:viktoriasulima1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const status = document.getElementById('formStatus');
  if (status) status.textContent = 'Открываем почту с подготовленной заявкой.';
});
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const savedLanguage = localStorage.getItem('viori-language') || 'ru';

// Переключатель языка теперь такой же, как на главной: раскрывающееся меню,
// а не выпадающий select. Разметка одинаковая на всех страницах.
const LANGUAGE_LABELS = { ru: 'Русский', en: 'English', nl: 'Nederlands', de: 'Deutsch', fr: 'Français' };
const languageSwitcher = document.querySelector('.language-switcher');
const languageTrigger = document.getElementById('languageMenuButton');

function closeLanguageMenu() {
  languageSwitcher?.classList.remove('open');
  languageTrigger?.setAttribute('aria-expanded', 'false');
}

function markActiveLanguage(code) {
  const label = document.getElementById('currentLanguageLabel');
  if (label) label.textContent = LANGUAGE_LABELS[code] || LANGUAGE_LABELS.ru;
  document.querySelectorAll('.language-button').forEach((button) => {
    const active = button.dataset.language === code;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

languageTrigger?.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = !languageSwitcher?.classList.contains('open');
  languageSwitcher?.classList.toggle('open', open);
  languageTrigger.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (event) => { if (!languageSwitcher?.contains(event.target)) closeLanguageMenu(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLanguageMenu(); });
document.querySelectorAll('.language-button').forEach((button) => button.addEventListener('click', () => {
  const code = button.dataset.language || 'ru';
  localStorage.setItem('viori-language', code);
  closeLanguageMenu();
  if (code === 'ru') location.reload(); else applyPageLanguage(code);
}));

// Счётчик корзины в шапке. Корзина живёт на главной, поэтому кнопка — ссылка.
function renderCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  let total = 0;
  try {
    total = (JSON.parse(localStorage.getItem('viori-cart') || '[]') || [])
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  } catch { total = 0; }
  badge.textContent = String(total);
  badge.closest('.cart-button')?.classList.toggle('has-items', total > 0);
}
renderCartCount();

const common = {
  en: ['Toys','Catalog','About','Contact','My account'],
  nl: ['Knuffels','Catalogus','Over VIORI','Contact','Mijn account'],
  de: ['Kuscheltiere','Katalog','Über VIORI','Kontakt','Mein Konto'],
  fr: ['Peluches','Catalogue','À propos','Contact','Mon compte']
};
const pageCopy = {
  'toys.html': {
    en: ['VIORI COLLECTION','Toys that become part of the family','Choose a special handmade character. Every toy has a personality, a private NFC passport and a story you continue.'],
    nl: ['VIORI-COLLECTIE','Knuffels die deel worden van het gezin','Kies een bijzonder handgemaakt personage met een eigen karakter, NFC-paspoort en verhaal.'],
    de: ['VIORI KOLLEKTION','Spielzeuge, die Teil der Familie werden','Wähle einen besonderen handgefertigten Charakter mit Persönlichkeit, NFC-Pass und eigener Geschichte.'],
    fr: ['COLLECTION VIORI','Des peluches qui entrent dans la famille','Choisissez un personnage artisanal avec son caractère, son passeport NFC et une histoire à poursuivre.']
  },
  'catalog.html': {
    en: ['VIORI CATALOG','Find your character','Choose a ready-made toy or share your idea — we will create a special character just for you.'],
    nl: ['VIORI-CATALOGUS','Vind jouw personage','Kies een bestaande knuffel of deel je idee — wij maken een bijzonder personage speciaal voor jou.'],
    de: ['VIORI-KATALOG','Finde deinen Charakter','Wähle ein fertiges Spielzeug oder teile deine Idee — wir erschaffen einen besonderen Charakter für dich.'],
    fr: ['CATALOGUE VIORI','Trouvez votre personnage','Choisissez un jouet disponible ou partagez votre idée — nous créerons un personnage rien que pour vous.']
  },
  'about.html': {
    en: ['ABOUT THE BRAND','Every toy has a life of its own','VIORI combines warm craftsmanship with thoughtful technology so a beloved character remains part of the family story.'],
    nl: ['OVER HET MERK','Elke knuffel heeft een eigen leven','VIORI verbindt warm handwerk met zorgvuldige technologie, zodat een geliefd personage deel blijft van het familieverhaal.'],
    de: ['ÜBER DIE MARKE','Jedes Kuscheltier hat ein eigenes Leben','VIORI verbindet warmes Handwerk mit durchdachter Technik, damit ein geliebter Charakter Teil der Familiengeschichte bleibt.'],
    fr: ['À PROPOS DE LA MARQUE','Chaque peluche a sa propre vie','VIORI unit le savoir-faire artisanal et une technologie attentionnée pour préserver chaque histoire de famille.']
  },
  'contact.html': {
    en: ['CONTACT','Let’s create someone special','Write to us about an order, delivery, NFC passport or collaboration. We will answer personally.'],
    nl: ['CONTACT','Laten we iets bijzonders maken','Schrijf ons over een bestelling, levering, NFC-paspoort of samenwerking. We antwoorden persoonlijk.'],
    de: ['KONTAKT','Lass uns etwas Besonderes erschaffen','Schreib uns zu Bestellung, Lieferung, NFC-Pass oder Zusammenarbeit. Wir antworten persönlich.'],
    fr: ['CONTACT','Créons quelque chose d’unique','Écrivez-nous au sujet d’une commande, livraison, passeport NFC ou collaboration. Nous répondrons personnellement.']
  }
};
const catalogCopy = {
  en: ['VIORI catalog','Ready-made characters and toys created especially for you.','CUSTOM TOY','Create a toy from your idea'],
  nl: ['VIORI-catalogus','Kant-en-klare personages en speelgoed dat speciaal voor jou wordt gemaakt.','MAATWERK','Maak een knuffel naar jouw idee'],
  de: ['VIORI-Katalog','Fertige Charaktere und Spielzeuge, die speziell für dich entstehen.','INDIVIDUELLES SPIELZEUG','Gestalte ein Spielzeug nach deiner Idee'],
  fr: ['Catalogue VIORI','Des personnages disponibles et des créations réalisées spécialement pour vous.','CRÉATION SUR MESURE','Créez un jouet à partir de votre idée']
};
const orderCopy = {
  en: {
    eyebrow: 'A simple process',
    title: 'How to order a toy',
    intro: 'From your first message to a beautiful parcel — in just four steps.',
    steps: [
      ['Choose a toy', 'Choose a model from the catalogue or send us your own idea.'],
      ['We agree the details', 'We confirm colour, size, personalisation, price and the time needed.'],
      ['We make it by hand', 'Our maker crochets the character and prepares its personal NFC passport.'],
      ['We deliver with care', 'You receive the toy, activate its passport and begin its story.']
    ]
  },
  nl: {
    eyebrow: 'Eenvoudig bestellen',
    title: 'Zo bestel je een VIORI',
    intro: 'Van het eerste bericht tot een mooi pakket — in slechts vier stappen.',
    steps: [
      ['Kies een knuffel', 'Kies een model uit de catalogus of stuur je eigen idee.'],
      ['We stemmen details af', 'We bepalen kleur, maat, personalisatie, prijs en levertijd.'],
      ['We maken het met de hand', 'Onze maker haakt het personage en maakt het persoonlijke NFC-paspoort.'],
      ['We bezorgen met zorg', 'Je ontvangt de knuffel, activeert het paspoort en begint haar verhaal.']
    ]
  },
  de: {
    eyebrow: 'Einfach bestellen',
    title: 'So bestellst du deine VIORI',
    intro: 'Von der ersten Nachricht bis zum schönen Paket — in nur vier Schritten.',
    steps: [
      ['Wähle ein Kuscheltier', 'Wähle ein Modell aus dem Katalog oder schicke uns deine eigene Idee.'],
      ['Wir klären die Details', 'Wir stimmen Farbe, Größe, Personalisierung, Preis und Fertigungszeit ab.'],
      ['Wir fertigen von Hand', 'Unsere Handwerkerin häkelt den Charakter und bereitet seinen persönlichen NFC-Pass vor.'],
      ['Wir liefern sorgfältig', 'Du erhältst das Kuscheltier, aktivierst den Pass und beginnst seine Geschichte.']
    ]
  },
  fr: {
    eyebrow: 'Commande simple',
    title: 'Comment commander votre VIORI',
    intro: 'Du premier message à un joli colis — en seulement quatre étapes.',
    steps: [
      ['Choisissez une peluche', 'Choisissez un modèle du catalogue ou envoyez-nous votre propre idée.'],
      ['Nous précisons les détails', 'Nous convenons de la couleur, la taille, la personnalisation, le prix et le délai.'],
      ['Nous créons à la main', 'Notre artisane crochète le personnage et prépare son passeport NFC personnel.'],
      ['Nous livrons avec soin', 'Vous recevez la peluche, activez son passeport et commencez son histoire.']
    ]
  }
};
function applyPageLanguage(code) {
  markActiveLanguage(code);
  document.documentElement.lang = code;
  if (code === 'ru') return location.reload();
  const navCopy = common[code];
  document.querySelectorAll('.main-nav a').forEach((link,index) => { if (navCopy?.[index]) link.textContent = navCopy[index]; });
  const accountText = document.querySelector('.account-button-text');
  if (accountText && navCopy) accountText.textContent = navCopy[4];
  const file = location.pathname.split('/').pop() || '';
  const copy = pageCopy[file]?.[code];
  if (copy) {
    const hero = document.querySelector('.subpage-hero');
    const eyebrow = hero?.querySelector('.eyebrow');
    const title = hero?.querySelector('h1');
    const intro = hero?.querySelector('.subpage-hero-copy');
    if (eyebrow) eyebrow.textContent = copy[0];
    if (title) title.textContent = copy[1];
    if (intro) intro.textContent = copy[2];
  }
  const order = document.getElementById('order');
  const orderText = orderCopy[code];
  if (order && orderText) {
    const orderEyebrow = order.querySelector('.eyebrow');
    const orderTitle = order.querySelector('h2');
    const orderIntro = order.querySelector('.section-heading > p');
    if (orderEyebrow) orderEyebrow.textContent = orderText.eyebrow;
    if (orderTitle) orderTitle.textContent = orderText.title;
    if (orderIntro) orderIntro.textContent = orderText.intro;
    order.querySelectorAll('.step').forEach((step, index) => {
      const stepText = orderText.steps[index];
      if (!stepText) return;
      const stepTitle = step.querySelector('h3');
      const stepBody = step.querySelector('p');
      if (stepTitle) stepTitle.textContent = stepText[0];
      if (stepBody) stepBody.textContent = stepText[1];
    });
  }
  if (file === 'catalog.html' && catalogCopy[code]) {
    const [title, intro, customLabel, customTitle] = catalogCopy[code];
    const catalogTitle = document.querySelector('#catalog .section-heading h2');
    const catalogIntro = document.querySelector('#catalog .catalog-intro');
    const customEyebrow = document.querySelector('#custom .contact-copy .eyebrow');
    const customHeading = document.querySelector('#custom .contact-copy h2');
    if (catalogTitle) catalogTitle.textContent = title;
    if (catalogIntro) catalogIntro.textContent = intro;
    if (customEyebrow) customEyebrow.textContent = customLabel;
    if (customHeading) customHeading.textContent = customTitle;
  }
}
markActiveLanguage(savedLanguage);
if (savedLanguage !== 'ru') applyPageLanguage(savedLanguage);
