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

// Свёрстанные вручную персонажи — только запасной вид, когда каталог из базы
// недоступен. Заказать их нельзя: create_order принимает лишь uuid товара из
// public.products, поэтому такой id всегда упирается в invalid_cart.
const backendReady = Boolean(window.VIORI_CONFIG?.supabaseUrl && window.VIORI_CONFIG?.supabaseAnonKey);

function catalogLanguage() {
  return localStorage.getItem('viori-language') || 'ru';
}

// Русский — как свёрстано, остальные языки берут английский вариант сказки.
function productCopy(product) {
  return catalogLanguage() === 'ru' ? product.ru : product.en;
}

function readCart() {
  let cart;
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
  if (!Array.isArray(cart)) return [];
  if (!backendReady) return cart;
  // Чистим записи, которые корзина на главной всё равно отфильтрует: из-за них
  // счётчик показывал товар, а открытая корзина оказывалась пустой.
  const usable = cart.filter((item) => item && typeof item.id === 'string' && !item.id.startsWith('static:') && !item.id.startsWith('catalog:'));
  if (usable.length !== cart.length) localStorage.setItem(CART_KEY, JSON.stringify(usable));
  return usable;
}

function addToCart(id, quantity) {
  const cart = readCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.quantity += quantity;
  else cart.push({ id, quantity });
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  // Владельца проставляем только для новой корзины. Если пометка уже есть,
  // корзина принадлежит вошедшему пользователю — перетирать её на "anon"
  // нельзя, иначе следующий аккаунт унаследует чужие товары.
  if (!localStorage.getItem('viori-cart-owner')) localStorage.setItem('viori-cart-owner', 'anon');
  renderCartCount();
}

function showCartNotice(message, href, linkLabel) {
  if (!toast) return;
  const link = toast.querySelector('.cart-toast-link');
  const text = document.getElementById('cartToastText');
  if (text) text.textContent = message;
  if (link) { link.textContent = linkLabel; link.setAttribute('href', href); }
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 5000);
}

function showCartToast(name) {
  const ru = catalogLanguage() === 'ru';
  showCartNotice(
    ru ? `«${name}» в корзине` : `“${name}” added to the cart`,
    'index.html?cart=1',
    ru ? 'Перейти в корзину' : 'Open the cart'
  );
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
    // Именно голый uuid: create_order приводит product_id к uuid,
    // а корзина на главной ищет товар по product.id без префиксов.
    id: dbId,
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
    tryAddToCart({ id: addFromModal.dataset.product || '', name: addFromModal.dataset.productName || '' });
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
    tryAddToCart(product);
  }
});

// Запасные карточки нельзя оформить: у них нет товара в базе. Честнее увести
// в контакты, чем положить в корзину то, что не пройдёт оформление заказа.
function tryAddToCart(product) {
  if (backendReady && product.id.startsWith('static:')) {
    showCartNotice(
      catalogLanguage() === 'ru'
        ? 'Этот персонаж пока не опубликован в каталоге'
        : 'This character is not published in the catalogue yet',
      'contact.html',
      catalogLanguage() === 'ru' ? 'Написать нам' : 'Contact us'
    );
    return;
  }
  addToCart(product.id, 1);
  showCartToast(product.name);
}

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
      uk: ['Познайомитися', 'Хочу таку'],
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
// Заявка сохраняется в базе и попадает в раздел «Заявки» у администратора.
// Раньше форма открывала почтовый клиент: если он не настроен, заявка терялась.
document.getElementById('orderForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const status = document.getElementById('formStatus');
  const submit = form.querySelector('button[type="submit"]');
  const ru = catalogLanguage() === 'ru';
  const config = window.VIORI_CONFIG;

  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    if (status) status.textContent = ru ? 'Отправка заявок сейчас недоступна.' : 'Requests cannot be sent right now.';
    return;
  }

  if (submit) submit.disabled = true;
  if (status) status.textContent = ru ? 'Отправляем заявку…' : 'Sending your request…';

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/submit_custom_request`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_name: String(data.get('name') || ''),
        contact_email: String(data.get('email') || ''),
        product: String(data.get('product') || ''),
        message: String(data.get('message') || '')
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('VIORI custom request error:', response.status, detail);
      if (status) {
        status.textContent = detail.includes('invalid_email')
          ? (ru ? 'Проверьте адрес электронной почты.' : 'Please check your email address.')
          : (ru ? 'Не удалось отправить заявку. Попробуйте ещё раз.' : 'Could not send the request. Please try again.');
      }
      return;
    }
    form.reset();
    if (status) status.textContent = ru
      ? 'Заявка отправлена. Мы ответим на указанную почту.'
      : 'Request sent. We will reply to the email you provided.';
  } catch (error) {
    console.error('VIORI custom request error:', error);
    if (status) status.textContent = ru ? 'Нет связи с сервером. Попробуйте позже.' : 'No connection to the server. Please try again later.';
  } finally {
    if (submit) submit.disabled = false;
  }
});
// Страница после сканирования NFC-чипа. Чип ведёт сюда с публичным кодом,
// поэтому здесь показываем только имя персонажа. Код активации печатается
// на карточке в коробке и вводится вручную — так чужой человек с игрушкой
// в руках не может привязать её к себе.
async function loadPassportPage() {
  const page = document.getElementById('passportPreview');
  if (!page) return;

  const ru = catalogLanguage() === 'ru';
  const nameEl = document.getElementById('passportPageName');
  const textEl = document.getElementById('passportPageText');
  const form = document.getElementById('passportActivateForm');
  const openAccount = document.getElementById('passportOpenAccount');
  const code = new URLSearchParams(location.search).get('code') || '';
  const config = window.VIORI_CONFIG;

  const show = (title, text) => {
    if (nameEl) nameEl.textContent = title;
    if (textEl) textEl.textContent = text;
  };

  if (!code.trim()) {
    show(ru ? 'Код не найден' : 'No code found',
      ru ? 'Поднесите телефон к метке внутри игрушки ещё раз.' : 'Tap your phone against the tag inside the toy once more.');
    return;
  }
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    show(ru ? 'Паспорт недоступен' : 'Passport unavailable',
      ru ? 'Сервис временно недоступен. Попробуйте позже.' : 'The service is temporarily unavailable. Please try again later.');
    return;
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/passport_preview`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    const passport = Array.isArray(rows) ? rows[0] : null;

    if (!passport) {
      show(ru ? 'Такой паспорт не найден' : 'Passport not found',
        ru ? 'Проверьте код на метке или напишите нам — мы поможем.' : 'Check the code on the tag or contact us — we will help.');
      return;
    }

    // Имя даёт владелец после активации; до этого показываем рабочее имя
    // от мастера, а если и его нет — нейтральную подпись.
    const name = passport.owner_name
      || (ru ? passport.character_name_ru : passport.character_name_en)
      || passport.character_name_ru
      || passport.character_name_en
      || (ru ? 'Персонаж VIORI' : 'VIORI character');

    // Сказка хранится по языкам. Если на языке посетителя её ещё не написали,
    // показываем английскую, затем русскую, затем любую заполненную —
    // пустая страница хуже, чем страница на другом языке.
    const stories = passport.story || {};
    const code = catalogLanguage();
    const story = stories[code] || stories.en || stories.ru || Object.values(stories).find(Boolean) || '';
    const storyEl = document.getElementById('passportPageStory');
    if (story && storyEl) {
      storyEl.textContent = story;
      storyEl.classList.remove('hidden');
    }
    if (passport.photo_path) {
      const photoEl = document.getElementById('passportPagePhoto');
      if (photoEl) {
        photoEl.src = `${config.supabaseUrl}/storage/v1/object/public/product-images/${encodeURI(passport.photo_path)}`;
        photoEl.alt = name;
        photoEl.classList.add('has-photo');
      }
    }

    if (passport.is_activated) {
      show(name, ru
        ? 'Этот паспорт уже активирован. Откройте личный кабинет владельца, чтобы прочитать историю и добавить новую главу.'
        : 'This passport is already activated. Open the owner account to read the story and add a new chapter.');
      openAccount?.classList.remove('hidden');
      if (openAccount) openAccount.textContent = ru ? 'Открыть в личном кабинете' : 'Open in my account';
    } else {
      show(name, ru
        ? 'Это персонаж VIORI, связанный вручную. Активируйте паспорт — и его история станет частью вашей семьи.'
        : 'This is a VIORI character, crocheted by hand. Activate the passport and its story becomes part of your family.');
      form?.classList.remove('hidden');
    }
  } catch (error) {
    console.error('VIORI passport error:', error);
    show(ru ? 'Не удалось открыть паспорт' : 'Could not open the passport',
      ru ? 'Проверьте связь и попробуйте ещё раз.' : 'Check your connection and try again.');
  }
}
void loadPassportPage();

// Активация требует входа в аккаунт, а форма входа живёт на главной,
// поэтому просто передаём туда введённый код активации.
document.getElementById('passportActivateForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = String(new FormData(event.currentTarget).get('token') || '').trim();
  if (!token) return;
  location.href = `index.html?nfc=${encodeURIComponent(token)}`;
});

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const savedLanguage = localStorage.getItem('viori-language') || 'ru';

// Переключатель языка теперь такой же, как на главной: раскрывающееся меню,
// а не выпадающий select. Разметка одинаковая на всех страницах.
const LANGUAGE_LABELS = { ru: 'Русский', uk: 'Українська', en: 'English', nl: 'Nederlands', de: 'Deutsch', fr: 'Français' };
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

// Роль запоминает главная страница при входе. Здесь она нужна только чтобы
// спрятать корзину у администратора — на доступ к данным это не влияет.
if (localStorage.getItem('viori-role') === 'admin') document.body.classList.add('viori-admin');

// Счётчик корзины в шапке. Корзина живёт на главной, поэтому кнопка — ссылка.
function renderCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  // readCart отбрасывает записи, которые корзина на главной не покажет,
  // иначе счётчик расходится с её содержимым.
  const total = readCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  badge.textContent = String(total);
  badge.closest('.cart-button')?.classList.toggle('has-items', total > 0);
}
renderCartCount();

const common = {
  uk: ['Іграшки','Каталог','Про бренд','Контакти','Особистий кабінет'],
  en: ['Toys','Catalog','About','Contact','My account'],
  nl: ['Knuffels','Catalogus','Over VIORI','Contact','Mijn account'],
  de: ['Kuscheltiere','Katalog','Über VIORI','Kontakt','Mein Konto'],
  fr: ['Peluches','Catalogue','À propos','Contact','Mon compte']
};
const pageCopy = {
  'toys.html': {
    uk: ['СВІТ VIORI','Іграшки, що стають частиною родини','Кожен персонаж створюється вручну, отримує власний характер, особистий NFC-паспорт та історію, яку продовжуєте ви.'],
    en: ['VIORI COLLECTION','Toys that become part of the family','Choose a special handmade character. Every toy has a personality, a private NFC passport and a story you continue.'],
    nl: ['VIORI-COLLECTIE','Knuffels die deel worden van het gezin','Kies een bijzonder handgemaakt personage met een eigen karakter, NFC-paspoort en verhaal.'],
    de: ['VIORI KOLLEKTION','Spielzeuge, die Teil der Familie werden','Wähle einen besonderen handgefertigten Charakter mit Persönlichkeit, NFC-Pass und eigener Geschichte.'],
    fr: ['COLLECTION VIORI','Des peluches qui entrent dans la famille','Choisissez un personnage artisanal avec son caractère, son passeport NFC et une histoire à poursuivre.']
  },
  'catalog.html': {
    uk: ['КАТАЛОГ VIORI','Знайдіть свого персонажа','Оберіть готову іграшку або розкажіть свою ідею — ми створимо особливого героя саме для вас.'],
    en: ['VIORI CATALOG','Find your character','Choose a ready-made toy or share your idea — we will create a special character just for you.'],
    nl: ['VIORI-CATALOGUS','Vind jouw personage','Kies een bestaande knuffel of deel je idee — wij maken een bijzonder personage speciaal voor jou.'],
    de: ['VIORI-KATALOG','Finde deinen Charakter','Wähle ein fertiges Spielzeug oder teile deine Idee — wir erschaffen einen besonderen Charakter für dich.'],
    fr: ['CATALOGUE VIORI','Trouvez votre personnage','Choisissez un jouet disponible ou partagez votre idée — nous créerons un personnage rien que pour vous.']
  },
  'about.html': {
    uk: ['ПРО БРЕНД','Кожна іграшка має власне життя','VIORI поєднує теплу ручну роботу й дбайливу технологію, щоб улюблений персонаж лишався частиною сімейної історії.'],
    en: ['ABOUT THE BRAND','Every toy has a life of its own','VIORI combines warm craftsmanship with thoughtful technology so a beloved character remains part of the family story.'],
    nl: ['OVER HET MERK','Elke knuffel heeft een eigen leven','VIORI verbindt warm handwerk met zorgvuldige technologie, zodat een geliefd personage deel blijft van het familieverhaal.'],
    de: ['ÜBER DIE MARKE','Jedes Kuscheltier hat ein eigenes Leben','VIORI verbindet warmes Handwerk mit durchdachter Technik, damit ein geliebter Charakter Teil der Familiengeschichte bleibt.'],
    fr: ['À PROPOS DE LA MARQUE','Chaque peluche a sa propre vie','VIORI unit le savoir-faire artisanal et une technologie attentionnée pour préserver chaque histoire de famille.']
  },
  'contact.html': {
    uk: ['КОНТАКТИ','Створімо когось особливого','Напишіть нам про замовлення, доставку, NFC-паспорт або співпрацю. Ми відповімо особисто.'],
    en: ['CONTACT','Let’s create someone special','Write to us about an order, delivery, NFC passport or collaboration. We will answer personally.'],
    nl: ['CONTACT','Laten we iets bijzonders maken','Schrijf ons over een bestelling, levering, NFC-paspoort of samenwerking. We antwoorden persoonlijk.'],
    de: ['KONTAKT','Lass uns etwas Besonderes erschaffen','Schreib uns zu Bestellung, Lieferung, NFC-Pass oder Zusammenarbeit. Wir antworten persönlich.'],
    fr: ['CONTACT','Créons quelque chose d’unique','Écrivez-nous au sujet d’une commande, livraison, passeport NFC ou collaboration. Nous répondrons personnellement.']
  },
  // Этой страницы здесь не было вовсе, поэтому её заголовок оставался
  // русским на всех языках, а не только на украинском.
  'faq.html': {
    uk: ['ДОПОМОГА VIORI','Питання та відповіді','Усе важливе про замовлення, NFC-паспорт і особистий світ вашої іграшки — коротко й зрозуміло.'],
    en: ['VIORI HELP','Questions and answers','Everything that matters about ordering, the NFC passport and your toy’s personal world — short and clear.'],
    nl: ['VIORI HELP','Vragen en antwoorden','Alles wat belangrijk is over bestellen, het NFC-paspoort en de eigen wereld van je knuffel — kort en duidelijk.'],
    de: ['VIORI HILFE','Fragen und Antworten','Alles Wichtige zur Bestellung, zum NFC-Pass und zur eigenen Welt deines Kuscheltiers — kurz und verständlich.'],
    fr: ['AIDE VIORI','Questions et réponses','L’essentiel sur la commande, le passeport NFC et le monde personnel de votre peluche — court et clair.']
  }
};
const catalogCopy = {
  uk: ['Каталог VIORI','Готові персонажі та іграшки, створені спеціально для вас.','ІНДИВІДУАЛЬНА ІГРАШКА','Створіть іграшку за своєю ідеєю'],
  en: ['VIORI catalog','Ready-made characters and toys created especially for you.','CUSTOM TOY','Create a toy from your idea'],
  nl: ['VIORI-catalogus','Kant-en-klare personages en speelgoed dat speciaal voor jou wordt gemaakt.','MAATWERK','Maak een knuffel naar jouw idee'],
  de: ['VIORI-Katalog','Fertige Charaktere und Spielzeuge, die speziell für dich entstehen.','INDIVIDUELLES SPIELZEUG','Gestalte ein Spielzeug nach deiner Idee'],
  fr: ['Catalogue VIORI','Des personnages disponibles et des créations réalisées spécialement pour vous.','CRÉATION SUR MESURE','Créez un jouet à partir de votre idée']
};
const orderCopy = {
  uk: {
    eyebrow: 'Простий процес',
    title: 'Як замовити іграшку',
    intro: 'Від першого повідомлення до гарної посилки — усього чотири кроки.',
    steps: [
      ['Оберіть іграшку', 'Оберіть модель з каталогу або надішліть свою ідею.'],
      ['Узгодимо деталі', 'Погодимо колір, розмір, персоналізацію, вартість і термін створення.'],
      ['Створимо вручну', 'Майстер зв\'яже персонажа й підготує його особистий NFC-паспорт.'],
      ['Дбайливо доставимо', 'Ви отримаєте іграшку, активуєте паспорт і почнете її історію.']
    ]
  },
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
// Тексты самих подстраниц раньше не переводились вообще: менялись только
// шапка и заголовок страницы, а содержимое оставалось русским на всех языках.
// Здесь — украинский; остальные языки пока берут русский оригинал.
const bodyCopyUk = {
  'toys.html': [
    ['.subpage-hero .button', 'Відкрити каталог'],
    ['.subpage-hero-stats div:nth-child(1) span', 'ручна робота'],
    ['.subpage-hero-stats div:nth-child(2) span', 'унікальна іграшка'],
    ['.subpage-hero-stats div:nth-child(3) span', 'тепла й турботи'],
    ['.subpage-heading .eyebrow', 'НЕ ПРОСТО ІГРАШКА'],
    ['.subpage-heading h2', 'У кожної іграшки свій характер'],
    ['.subpage-heading p', 'Невеликі серії, ручна робота та увага до деталей роблять кожного персонажа особливим.'],
    ['.editorial-card:nth-child(1) h3', 'Зв\'язано вручну'],
    ['.editorial-card:nth-child(1) p', 'Кожна петля створюється людиною, тому дві іграшки ніколи не бувають повністю однаковими.'],
    ['.editorial-card:nth-child(2) h3', 'Особистий паспорт'],
    ['.editorial-card:nth-child(2) p', 'NFC відкриває захищену сторінку з ім\'ям, походженням і пам\'ятними подіями іграшки.'],
    ['.editorial-card:nth-child(3) h3', 'Для вашої історії'],
    ['.editorial-card:nth-child(3) p', 'Додавайте сімейні спогади й продовжуйте життя персонажа рік за роком.'],
    ['.page-cta h2', 'Оберіть готову іграшку або створіть свою'],
    ['.page-cta .button', 'Перейти в каталог']
  ],
  'about.html': [
    ['.subpage-heading .eyebrow', 'НАША ФІЛОСОФІЯ'],
    ['.subpage-heading h2', 'Зроблено петля за петлею'],
    ['.subpage-heading p', 'Ми віримо, що цінність з\'являється не зі швидкості виробництва, а з турботи, характеру та спогадів, які лишаються разом із річчю.'],
    ['.editorial-card:nth-child(1) h3', 'Людське тепло'],
    ['.editorial-card:nth-child(1) p', 'Іграшки створюються вручну невеликими партіями, з увагою до форми, виразу й фактури.'],
    ['.editorial-card:nth-child(2) h3', 'Безпечна пам\'ять'],
    ['.editorial-card:nth-child(2) p', 'NFC — лише ключ до особистого світу іграшки. Він не відстежує місцезнаходження власника.'],
    ['.editorial-card:nth-child(3) h3', 'Довге життя'],
    ['.editorial-card:nth-child(3) p', 'Паспорт, історія володіння та спогади допомагають іграшці лишатися значущою багато років.'],
    ['.trust-section .eyebrow', 'СПОКІЙ ДЛЯ БАТЬКІВ'],
    ['.trust-section .section-heading h2', 'Створено дбайливо й прозоро'],
    ['.trust-section .section-heading > p', 'Ми хочемо, щоб ви знали історію не лише персонажа, а й кожного матеріалу, з якого він створений.'],
    ['.trust-card:nth-child(1) h3', 'Ручна робота'],
    ['.trust-card:nth-child(1) p', 'Кожна деталь створюється невеликими партіями та перевіряється перед відправкою.'],
    ['.trust-card:nth-child(2) h3', 'Зрозумілі матеріали'],
    ['.trust-card:nth-child(2) p', 'Склад, наповнювач, рекомендації з догляду та вікове маркування вказані на сторінці товару.'],
    ['.trust-card:nth-child(3) h3', 'Перевірка перед відправкою'],
    ['.trust-card:nth-child(3) p', 'Кожна іграшка оглядається вручну: міцність швів, надійність кріплення очей, носа й дрібних деталей.'],
    ['.trust-card:nth-child(4) h3', 'Вікове маркування'],
    ['.trust-card:nth-child(4) p', 'До завершення офіційних випробувань іграшки не призначені для дітей молодших за 3 роки. Актуальне маркування вказується на сторінці товару.'],
    ['.compliance-status span', 'Сертифікація за нормами ЄС для дитячих іграшок'],
    ['.compliance-status span', 'Сертифікація за нормами ЄС для дитячих іграшок'],
    ['.compliance-status strong', 'У процесі: оцінка ризиків, випробування та EU Declaration of Conformity ще не завершені'],
    ['.compliance-note', 'Маркування CE наноситься й публікується лише після підтвердження відповідності. Подробиці — у розділі <a href="legal.html#safety">«Безпека іграшок»</a>.'],
    ['.page-cta h2', 'Познайомтеся з героями VIORI'],
    ['.page-cta .button-secondary', 'Питання та відповіді'],
    ['.page-cta-actions .button:not(.button-secondary)', 'Перейти до колекції']
  ],
  'faq.html': [
    ['.faq-layout .eyebrow', 'ЧАСТІ ЗАПИТАННЯ'],
    ['.faq-layout h2', 'Тут є потрібна відповідь'],
    ['.faq-layout > div:first-child > p', 'Якщо вашого питання немає у списку, напишіть нам — ми відповімо особисто.'],
    ['.faq details:nth-child(1) summary', 'Як працює NFC?'],
    ['.faq details:nth-child(1) p', 'Піднесіть сумісний телефон до мітки всередині іграшки. Відкриється захищена сторінка її цифрового паспорта — застосунок встановлювати не потрібно.'],
    ['.faq details:nth-child(2) summary', 'Чи потрібно дитині створювати акаунт?'],
    ['.faq details:nth-child(2) p', 'Ні. Кабінетом і сімейними даними керує доросла людина — власник акаунта.'],
    ['.faq details:nth-child(3) summary', 'Чи можна подарувати або передати іграшку?'],
    ['.faq details:nth-child(3) p', 'Так. Власник може безпечно передати цифровий паспорт іншій дорослій людині, зберігши обрані розділи історії.'],
    ['.faq details:nth-child(4) summary', 'Як оформити замовлення?'],
    ['.faq details:nth-child(4) p', 'Оберіть іграшку в каталозі та натисніть «Хочу таку». Ми зв\'яжемося з вами, уточнимо колір, розмір і персональні деталі, а потім підтвердимо вартість і термін виготовлення.'],
    ['.faq details:nth-child(5) summary', 'Що робити, якщо NFC не зчитується?'],
    ['.faq details:nth-child(5) p', 'Розблокуйте телефон і піднесіть верхню частину корпусу до мітки на кілька секунд. Якщо сторінка не відкривається, напишіть нам — ми допоможемо перевірити паспорт.'],
    ['.faq details:nth-child(6) summary', 'Як доглядати за іграшкою?'],
    ['.faq details:nth-child(6) p', 'Точні рекомендації залежать від матеріалів і вказуються на сторінці товару та в замовленні. Для ручної роботи зазвичай підходить особливо дбайливе чищення без агресивних засобів.'],
    ['.page-cta h2', 'Не знайшли потрібної відповіді?'],
    ['.page-cta .button', 'Зв\'язатися з VIORI']
  ],
  'catalog.html': [
    ['.subpage-hero .button', 'Дивитися іграшки'],
    ['#custom .contact-link:nth-child(1) small', 'Написати нам'],
    ['#custom .contact-link:nth-child(2) small', 'Допомога із замовленням'],
    ['#custom .contact-link:nth-child(2) strong', 'Підтримка VIORI'],
    ['.filters [data-filter="all"]', 'Усі'],
    ['.filters [data-filter="animals"]', 'Тварини'],
    ['.filters [data-filter="dolls"]', 'Ляльки'],
    ['.filters [data-filter="baby"]', 'Для малюків'],
    ['#custom .contact-copy > p:not(.eyebrow)', 'Розкажіть, кого ви уявляєте. Ми уточнимо колір, розмір, одяг і персональні деталі, а потім розрахуємо вартість.'],
    ['.form-row .label-text', 'Ваше ім\'я'],
    ['.order-form > label:nth-of-type(1) .label-text', 'Ваш email'],
    ['.order-form > label:nth-of-type(2) .label-text', 'Що хочете замовити?'],
    ['.order-form > label:nth-of-type(3) .label-text', 'Побажання'],
    ['.form-submit', 'Надіслати заявку']
  ],
  'contact.html': [
    ['.subpage-heading .eyebrow', 'ЗВ\'ЯЗАТИСЯ З VIORI'],
    ['.subpage-heading h2', 'Ми поруч на кожному етапі'],
    ['.subpage-heading p', 'Для питань щодо наявного замовлення вкажіть його номер і email, використаний при оформленні.'],
    ['.subpage-contact-card:nth-child(1) small', 'Email'],
    ['.subpage-contact-card:nth-child(2) small', 'Підтримка й замовлення'],
    ['.subpage-contact-card:nth-child(2) strong', 'Відкрити особистий кабінет →'],
    ['.subpage-contact-card:nth-child(3) small', 'Допомога'],
    ['.subpage-contact-card:nth-child(3) strong', 'Питання та відповіді →'],
    ['.subpage-contact-card:nth-child(4) small', 'Новий персонаж'],
    ['.subpage-contact-card:nth-child(4) strong', 'Залишити заявку →'],
    ['.subpage-contact-card:nth-child(5) small', 'Документи'],
    ['.subpage-contact-card:nth-child(5) strong', 'Умови та конфіденційність →'],
    ['.page-cta h2', 'Почніть з персонажа, який стане вашим'],
    ['.page-cta .button', 'Дивитися колекцію']
  ],
  // Юридические тексты. Перевод — для удобства читателя; эталоном остаётся
  // русская версия, а перед реальным запуском формулировки должен проверить
  // юрист, знакомый с правом Нидерландов.
  'legal.html': [
    ['.legal-hero .eyebrow', 'VIORI · ЮРИДИЧНИЙ ЦЕНТР'],
    ['.legal-hero h1', 'Турбота починається <em>з прозорості</em>'],
    ['.legal-hero > .container > p', 'Тут зібрані правила магазину, обробки даних, NFC-паспортів, доставки та повернення.'],
    ['.legal-nav a:nth-child(1)', 'Продавець'],
    ['.legal-nav a:nth-child(2)', 'Умови'],
    ['.legal-nav a:nth-child(3)', 'Повернення'],
    ['.legal-nav a:nth-child(4)', 'Приватність'],
    ['.legal-nav a:nth-child(5)', 'NFC'],
    ['.legal-nav a:nth-child(6)', 'Безпека'],
    ['.legal-warning strong', 'Перед реальним запуском'],
    ['.legal-warning p', 'Заповніть позначені поля: юридичну назву, адресу, email, телефон, KVK і BTW-id. Поки вони не заповнені, магазин не можна вважати юридично готовим до приймання оплати.'],
    ['#seller h2', 'Інформація про продавця'],
    ['#seller dt:nth-of-type(1), #seller div:nth-child(1) dt', 'Торгова назва'],
    ['#seller div:nth-child(2) dt', 'Юридична назва'],
    ['#seller div:nth-child(3) dt', 'Адреса в Нідерландах'],
    ['#seller div:nth-child(5) dt', 'Телефон'],
    ['#seller div:nth-child(6) dd', 'Реєстрація запланована'],
    ['#seller div:nth-child(7) dd', 'Буде додано після реєстрації'],
    ['#terms h2', 'Умови продажу'],
    ['#terms h3:nth-of-type(1)', 'Пропозиція та замовлення'],
    ['#terms p:nth-of-type(1)', 'На сторінці товару вказуються основні характеристики, ціна з застосовними податками, персоналізація, орієнтовний строк виготовлення та вартість доставки. Договір вважається укладеним після підтвердження замовлення продавцем. Очевидні помилки в ціні чи описі не створюють обовʼязку постачити товар на помилкових умовах.'],
    ['#terms h3:nth-of-type(2)', 'Ручна робота'],
    ['#terms p:nth-of-type(2)', 'Іграшки створюються вручну, тому невеликі відмінності у формі, відтінку та розташуванні деталей є особливістю виробу, а не дефектом. Погоджені персональні параметри фіксуються в підтвердженні замовлення.'],
    ['#terms h3:nth-of-type(3)', 'Оплата'],
    ['#terms p:nth-of-type(3)', 'Доступні способи оплати та повна сума показуються до підтвердження. Реальна оплата стане доступною лише після підключення сертифікованого платіжного провайдера.'],
    ['#terms h3:nth-of-type(4)', 'Доставка'],
    ['#terms p:nth-of-type(4)', 'Строк виготовлення й доставки повідомляється до замовлення. Якщо не погоджено інше, продавець виконує замовлення не пізніше ніж за 30 днів. Ризик пошкодження або втрати лишається у продавця до отримання замовлення покупцем.'],
    ['#terms h3:nth-of-type(5)', 'Гарантія та скарги'],
    ['#terms p:nth-of-type(5)', 'Товар має відповідати розумним очікуванням покупця. Про дефект слід повідомити продавця з номером замовлення та фотографіями. Відповідь на скаргу надається в розумний строк.'],
    ['#returns h2', 'Повернення та скасування'],
    ['#returns p:nth-of-type(1)', 'Для стандартних товарів покупець зазвичай може відмовитися від дистанційної покупки протягом 14 календарних днів після отримання без пояснення причини. Після повідомлення товар слід повернути у встановлений законом строк.'],
    ['#returns p:nth-of-type(2)', 'Виняток може застосовуватися до товару, виготовленого за індивідуальним вибором або явно персоналізованого. Виняток застосовується лише тоді, коли персоналізація справді робить товар індивідуальним, і покупця було чітко попереджено до оплати.'],
    ['#returns p:nth-of-type(3)', 'Товар можна оглянути так, як це припустимо у звичайному магазині. Покупець може відповідати за зменшення вартості через використання понад необхідну перевірку. Порядок і вартість зворотної доставки повідомляються до покупки.'],
    ['#returns .button', 'Скасувати замовлення онлайн'],
    ['#privacy h2', 'Політика конфіденційності'],
    ['#privacy h3:nth-of-type(1)', 'Які дані обробляються'],
    ['#privacy p:nth-of-type(1)', 'Імʼя, контактні дані, адреса доставки, зміст замовлення, історія оплати й доставки, дані акаунта, активовані NFC-паспорти та добровільно додані сімейні спогади.'],
    ['#privacy h3:nth-of-type(2)', 'Цілі та підстави'],
    ['#privacy p:nth-of-type(2)', 'Дані використовуються для виконання замовлення й договору, дотримання юридичних обовʼязків, забезпечення безпеки сервісу та — лише за окремою згодою — маркетингу чи необовʼязкової аналітики.'],
    ['#privacy h3:nth-of-type(3)', 'Дані дітей'],
    ['#privacy p:nth-of-type(3)', 'Акаунт створює й контролює доросла людина. VIORI не просить дитину створювати акаунт і не використовує NFC для геолокації чи стеження. Не додавайте чутливі відомості про дитину у вільні поля.'],
    ['#privacy h3:nth-of-type(4)', 'Одержувачі'],
    ['#privacy p:nth-of-type(4)', 'Дані можуть передаватися лише необхідним постачальникам: хостингу, платіжному провайдеру, службі доставки, email-сервісу та технічним підрядникам на підставі відповідних договорів.'],
    ['#privacy h3:nth-of-type(5)', 'Строки та права'],
    ['#privacy p:nth-of-type(5)', 'Дані зберігаються не довше, ніж потрібно для мети та обовʼязкового бухгалтерського строку. Користувач може запросити доступ, виправлення, видалення, обмеження, перенесення даних або заперечити проти обробки. Контакт для таких запитів: [УКАЗАТЬ EMAIL].'],
    ['#privacy h3:nth-of-type(6)', 'Захист'],
    ['#privacy p:nth-of-type(6)', 'На релізі використовуються HTTPS, хешування паролів, розмежування ролей, резервні копії та журналювання важливих операцій. Поточна локальна демоверсія не призначена для зберігання реальних клієнтських даних.'],
    ['#nfc h2', 'Правила NFC-паспорта'],
    ['#nfc p:nth-of-type(1)', 'NFC-мітка містить посилання або ідентифікатор і не призначена для визначення місцезнаходження. Один паспорт активується одним дорослим акаунтом. Власник зобовʼязаний берегти посилання активації й не публікувати його до прив\'язки.'],
    ['#nfc p:nth-of-type(2)', 'При передачі іграшки новий власник отримує доступ лише після підтвердженої процедури передачі. Сімейні спогади не передаються автоматично без рішення попереднього власника. VIORI може тимчасово заблокувати паспорт за підозри на зловживання.'],
    ['#cookies h2', 'Cookies'],
    ['#cookies p', 'Необхідні cookies і локальне сховище використовуються для мови, кошика, входу та безпеки. Необовʼязкова аналітика чи рекламні технології вмикаються лише після згоди. Користувач може змінити вибір кнопкою «Налаштування cookies» внизу сайту.'],
    ['#safety h2', 'Безпека іграшок'],
    ['#safety p:nth-of-type(1)', 'До початку продажів для кожної моделі мають бути завершені оцінка ризиків, застосовні випробування, технічний файл та EU Declaration of Conformity. CE, вікове маркування й попередження публікуються лише після підтвердження відповідності.'],
    ['#safety .compliance-status span', 'Статус підготовки'],
    ['#safety .compliance-status strong', 'Документи та випробування ще не підтверджені'],
    ['#safety p:nth-of-type(2)', 'До зміни цього статусу сайт є демонстрацією і не має приймати оплату за дитячі іграшки.'],
    ['#legalUpdated', 'Останнє оновлення: 2 серпня 2026']
  ],
  'passport.html': [
    ['#passportActivateLabel', 'Код активації з картки в коробці'],
    ['#passportActivateButton', 'Активувати паспорт'],
    ['#passportActivateNote', 'Паспорт можна прив\'язати лише до одного дорослого акаунта.'],
    ['#passportPageEyebrow', 'ЦИФРОВИЙ ПАСПОРТ']
  ]
};

function applyBodyCopy(code, file) {
  if (code !== 'uk') return;
  (bodyCopyUk[file] || []).forEach(([selector, text]) => {
    const element = document.querySelector(selector);
    if (!element) return;
    // Часть строк содержит ссылки, поэтому вставляем как разметку.
    // Тексты здесь наши собственные, не пользовательские.
    if (text.includes('<')) element.innerHTML = text;
    else element.textContent = text;
  });
}

function applyPageLanguage(code) {
  markActiveLanguage(code);
  document.documentElement.lang = code;
  if (code === 'ru') return location.reload();
  const navCopy = common[code];
  document.querySelectorAll('.main-nav a').forEach((link,index) => { if (navCopy?.[index]) link.textContent = navCopy[index]; });
  const accountText = document.querySelector('.account-button-text');
  if (accountText && navCopy) accountText.textContent = navCopy[4];
  const file = location.pathname.split('/').pop() || '';
  applyBodyCopy(code, file);
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
