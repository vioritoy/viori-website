const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-nav');
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
document.querySelectorAll('.view-product,.add-to-cart').forEach((button) => button.addEventListener('click', () => {
  location.href = button.classList.contains('add-to-cart') ? 'index.html#contacts' : 'contact.html';
}));
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
    grid.innerHTML = products.map((product) => {
      const name = code === 'ru' ? product.name_ru : product.name_en;
      const description = code === 'ru' ? product.description_ru : product.description_en;
      const path = product.product_images?.[0]?.storage_path;
      const image = path ? `${config.supabaseUrl}/storage/v1/object/public/product-images/${encodeURI(path)}` : '';
      return `<article class="product-card" data-category="${product.category}"><div class="product-image"${image ? ` style="background-image:url('${image}');background-size:cover;background-position:center"` : ''}></div><div class="product-info"><div><p class="product-type">VIORI</p><h3>${name}</h3></div><p class="price">€${(product.price_cents / 100).toFixed(2)}</p></div><p class="product-description">${description}</p><div class="card-actions"><a class="card-button" href="contact.html">Подробнее</a><a class="card-button" href="index.html#contacts">Заказать</a></div></article>`;
    }).join('');
  } catch { /* Keep the static fallback when the network is unavailable. */ }
}
void loadPageCatalog();
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const language = document.createElement('select');
language.className = 'page-language-select';
language.setAttribute('aria-label', 'Language');
language.innerHTML = '<option value="ru">RU</option><option value="en">EN</option><option value="nl">NL</option><option value="de">DE</option><option value="fr">FR</option>';
const savedLanguage = localStorage.getItem('viori-language') || 'ru';
language.value = savedLanguage;
document.querySelector('.account-button')?.before(language);

const common = {
  en: ['Toys','About','How to order','Contact','My account'],
  nl: ['Knuffels','Over VIORI','Bestellen','Contact','Mijn account'],
  de: ['Kuscheltiere','Über VIORI','Bestellen','Kontakt','Mein Konto'],
  fr: ['Peluches','À propos','Commander','Contact','Mon compte']
};
const pageCopy = {
  'toys.html': {
    en: ['VIORI COLLECTION','Characters you will want to remember','Every toy is made by hand and receives a name, a personality and a place for its own digital story.'],
    nl: ['VIORI-COLLECTIE','Personages om te koesteren','Elke knuffel wordt met de hand gemaakt en krijgt een naam, karakter en plek voor een eigen digitaal verhaal.'],
    de: ['VIORI KOLLEKTION','Charaktere, die in Erinnerung bleiben','Jedes Kuscheltier wird von Hand gefertigt und erhält einen Namen, Charakter und seine eigene digitale Geschichte.'],
    fr: ['COLLECTION VIORI','Des personnages à chérir','Chaque peluche est créée à la main et reçoit un nom, un caractère et sa propre histoire numérique.']
  },
  'about.html': {
    en: ['ABOUT THE BRAND','Every toy has a life of its own','VIORI combines warm craftsmanship with thoughtful technology so a beloved character remains part of the family story.'],
    nl: ['OVER HET MERK','Elke knuffel heeft een eigen leven','VIORI verbindt warm handwerk met zorgvuldige technologie, zodat een geliefd personage deel blijft van het familieverhaal.'],
    de: ['ÜBER DIE MARKE','Jedes Kuscheltier hat ein eigenes Leben','VIORI verbindet warmes Handwerk mit durchdachter Technik, damit ein geliebter Charakter Teil der Familiengeschichte bleibt.'],
    fr: ['À PROPOS DE LA MARQUE','Chaque peluche a sa propre vie','VIORI unit le savoir-faire artisanal et une technologie attentionnée pour préserver chaque histoire de famille.']
  },
  'how-to-order.html': {
    en: ['A SIMPLE PROCESS','From the first idea to a new story','Choose your character and details, and we will carefully bring them to life.'],
    nl: ['EENVOUDIG PROCES','Van het eerste idee tot een nieuw verhaal','Kies je personage en details; wij brengen het met zorg tot leven.'],
    de: ['EINFACHER ABLAUF','Von der ersten Idee zur neuen Geschichte','Wähle Charakter und Details – wir erwecken sie mit Sorgfalt zum Leben.'],
    fr: ['UN PROCESSUS SIMPLE','De la première idée à une nouvelle histoire','Choisissez votre personnage et ses détails, nous lui donnerons vie avec soin.']
  },
  'contact.html': {
    en: ['CONTACT','Let’s create someone special','Write to us about an order, delivery, NFC passport or collaboration. We will answer personally.'],
    nl: ['CONTACT','Laten we iets bijzonders maken','Schrijf ons over een bestelling, levering, NFC-paspoort of samenwerking. We antwoorden persoonlijk.'],
    de: ['KONTAKT','Lass uns etwas Besonderes erschaffen','Schreib uns zu Bestellung, Lieferung, NFC-Pass oder Zusammenarbeit. Wir antworten persönlich.'],
    fr: ['CONTACT','Créons quelque chose d’unique','Écrivez-nous au sujet d’une commande, livraison, passeport NFC ou collaboration. Nous répondrons personnellement.']
  }
};
function applyPageLanguage(code) {
  language.value = code;
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
}
if (savedLanguage !== 'ru') applyPageLanguage(savedLanguage);
language.addEventListener('change', () => {
  localStorage.setItem('viori-language', language.value);
  if (language.value === 'ru') location.reload(); else applyPageLanguage(language.value);
});
