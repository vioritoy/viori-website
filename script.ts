import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window { VIORI_CONFIG?: { supabaseUrl?: string; supabaseAnonKey?: string }; }
}

// Постоянный адрес сайта. Нужен для NFC-меток: их печатают один раз,
// поэтому адрес не должен зависеть от того, где открыта админка.
const PUBLIC_SITE_URL = "https://vioritoy.github.io/viori-website/";

const backendConfig = window.VIORI_CONFIG;
const arrivedFromOAuth = location.hash.includes("access_token=") || location.search.includes("code=");
const supabase: SupabaseClient | null = backendConfig?.supabaseUrl && backendConfig?.supabaseAnonKey
  ? createClient(backendConfig.supabaseUrl, backendConfig.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
document.documentElement.dataset.backend = supabase ? "supabase" : "local-demo";

const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const mainNav = document.querySelector<HTMLElement>(".main-nav");

type Language = "ru" | "uk" | "en" | "nl" | "de" | "fr";
interface Memory { id: string; title: string; text: string; date: string; }
interface Toy { code: string; name: string; born: string; nameRu?: string; nameEn?: string; memories?: Memory[]; }
interface Order { product: FormDataEntryValue | string; date: string; status: string; }
interface Account { name: string; email: string; password: string; toys: Toy[]; orders: Order[]; role?: "admin" | "customer"; }
type Accounts = Record<string, Account>;
interface CatalogProduct { id: string; nameRu: string; nameEn: string; category: "animals" | "dolls" | "baby"; price: number; descriptionRu: string; descriptionEn: string; image: string; }
interface ShopProduct { id: string; name: string; price: number; description: string; image: string; }
interface CartItem { id: string; quantity: number; }
interface CheckoutOrder { number: string; createdAt: string; customer: { name: string; email: string; phone: string; address: string; postcode: string; city: string }; items: Array<{ id: string; name: string; price: number; quantity: number }>; delivery: "standard" | "pickup"; deliveryPrice: number; total: number; payment: string; status: "new" | "making" | "shipped" | "completed" | "cancelled"; }
interface NfcPassport { code: string; nameRu: string; nameEn: string; orderNumber: string; issuedAt: string; ownerEmail: string | null; claimedAt: string | null; }
interface CancellationRequest { reference: string; orderNumber: string; email: string; reason: string; createdAt: string; }

const englishTranslations: Record<string, string> = {
  "title": "VIORI — handmade crochet toys",
  'meta[name="description"]': "VIORI — handmade crochet toys. Unique gifts made with love.",
  ".main-nav a:nth-child(1)": "Toys",
  ".main-nav a:nth-child(2)": "Catalog",
  ".main-nav a:nth-child(3)": "About",
  ".main-nav a:nth-child(4)": "Contacts",
  ".account-button-text": "My account",
  ".auth-home-button": '<span aria-hidden="true">←</span> Home',
  ".google-auth-button span": "Continue with Google",
  ".auth-divider span": "or use email",
  ".hero-copy .eyebrow": "VIORI · MADE BY HAND",
  ".hero-copy h1": "Every toy <em>has a life of its own</em>",
  ".hero-text": "Every VIORI is handmade and receives a name, a character and a unique digital passport. Tap the NFC tag with your phone to discover her story, memories and new chapters.",
  ".hero-actions .button": "View toys",
  ".hero-actions .text-link": "Order your own idea <span>→</span>",
  ".hero-points span:nth-child(1)": "♡ Handmade",
  ".hero-points span:nth-child(2)": "♡ Unique character",
  ".hero-points span:nth-child(3)": "♡ Personal NFC passport",
  ".tag-two": "Made with care",
  "#catalog .section-heading .eyebrow": "A small collection",
  "#catalog .section-heading h2": "VIORI toys",
  "#catalog .section-heading > p": "This is where you can add real photos, sizes and prices for each toy.",
  '.filters [data-filter="all"]': "All",
  '.filters [data-filter="animals"]': "Animals",
  '.filters [data-filter="dolls"]': "Dolls",
  '.filters [data-filter="baby"]': "For babies",
  ".product-image span": "Add a photo",
  ".product-type": "Crochet toy",
  ".product-info h3": "Mia the Bunny",
  ".price": "from €29",
  ".product-description": "A soft toy with long ears. You can choose the colour of the outfit.",
  ".order-product": "Order",
  "#about .eyebrow": "About the studio",
  "#about h2": "Every stitch tells a story",
  "#about .story-copy > p:nth-of-type(2)": "VIORI is a small family studio making crochet toys. There is no mass production here: every detail is carefully made by hand.",
  "#about .story-copy > p:nth-of-type(3)": "You can choose the toy’s colour, size and outfit, and add a personal detail — a name, a small accessory or gift wrapping.",
  ".stats div:nth-child(1) span": "handmade",
  ".stats div:nth-child(2) span": "unique toy",
  ".stats div:nth-child(3) span": "warmth and care",
  "#contacts .eyebrow": "Get in touch with VIORI",
  "#contacts h2": "Let’s create a special toy",
  "#contacts .contact-copy > p:nth-of-type(2)": "Tell us which toy you like or share your own idea. We’ll reply, discuss the details and calculate the price.",
  ".contact-link:nth-child(1) small": "Message us on",
  ".contact-link:nth-child(2) small": "View our",
  ".small-note": "Before publishing, replace the WhatsApp number and Instagram link with the real ones.",
  '.form-row .label-text': "Your name",
  '.order-form > label:nth-of-type(1) .label-text': "What would you like to order?",
  '.order-form > label:nth-of-type(2) .label-text': "Your wishes",
  "#productSelect option": "Mia the Bunny",
  ".form-submit": "Send request",
  ".footer > .container > p": '© <span id="year"></span> VIORI. Handmade crochet toys.',
  ".auth-view > .eyebrow": "VIORI WORLD",
  "#accountTitle": "Your toy’s life",
  ".account-intro": "Create an account to place orders, register toys using their NFC code and keep their stories safe.",
  '.auth-tab[data-auth-tab="login"]': "Sign in",
  '.auth-tab[data-auth-tab="register"]': "Register",
  '#loginForm label:nth-child(1) span': "Email",
  '#loginForm label:nth-child(2) span': "Password",
  "#loginForm .button": "Sign in",
  ".auth-story-panel .eyebrow": "HER WORLD STARTS HERE",
  ".auth-story-panel h2": "A story that stays with your family",
  ".auth-story-panel > div:nth-child(2) > p:last-child": "One secure adult account keeps toys, orders and precious family chapters together.",
  ".auth-benefits li:nth-child(1) span": "<strong>Personal NFC passport</strong><small>Only the owner controls the toy's story</small>",
  ".auth-benefits li:nth-child(2) span": "<strong>Family memories</strong><small>Save meaningful moments and new chapters</small>",
  ".auth-benefits li:nth-child(3) span": "<strong>Orders in one place</strong><small>Follow your character from creation to delivery</small>",
  ".auth-trust": "Protected by Supabase · NFC does not track location",
  "#registerForm .registration-progress p": "Secure registration takes less than a minute",
  '#registerForm > label:nth-of-type(1) > span': "Your name",
  '#registerForm > label:nth-of-type(2) > span': "Email",
  '#registerForm > label:nth-of-type(3) > span': "Create a password",
  '#registerForm > label:nth-of-type(4) > span': "Repeat password",
  '#registerForm > label:nth-of-type(5) > span': "I confirm that this account is managed by an adult",
  '#registerForm > label:nth-of-type(6) > span': 'I accept the <a href="legal.html#terms" target="_blank">terms</a> and <a href="legal.html#privacy" target="_blank">privacy policy</a>',
  "#registerForm .registration-submit span": "Create my VIORI world",
  "#registerForm .registration-security": "Your data is encrypted. We never sell personal information.",
  "#registrationSuccess .eyebrow": "ALMOST THERE",
  "#registrationSuccess h2": "Confirm your email",
  "#registrationSuccess > p:not(.eyebrow)": "We sent you a secure link. After confirmation, your personal VIORI world will open.",
  "#registrationSuccess .button": "Continue to sign in",
  ".dashboard-head .eyebrow": "MY ACCOUNT",
  ".dashboard-greeting": "Hello,",
  '.dashboard-tab[data-dashboard-tab="toys"]': "My toys",
  '.dashboard-tab[data-dashboard-tab="orders"]': "Orders",
  '.dashboard-tab[data-dashboard-tab="profile"]': "Profile",
  "#logoutButton": "Sign out",
  ".toy-empty h3": "This is where her life begins",
  ".toy-empty p": "Tap the toy’s NFC tag with your phone or enter the code manually.",
  ".nfc-form label span": "Activation code from the card",
  ".nfc-form .button": "Add toy",
  '.dashboard-page[data-dashboard-page="orders"] > .button': "Choose a new toy",
  '.dashboard-page[data-dashboard-page="profile"] .profile-card:nth-child(1) span': "Name",
  '.dashboard-page[data-dashboard-page="profile"] .profile-card:nth-child(2) span': "Email",
  ".privacy-note": "Your account keeps your toys’ stories, orders and access to the personal VIORI world."
  , '.admin-heading .eyebrow': "VIORI CATALOGUE",
  '.admin-heading h3': "Toys on the site",
  '.admin-heading > p:not(.eyebrow)': "Published cards are visible to every catalogue visitor.",
  '.image-upload > span': "Toy photo",
  '.image-upload small': "JPG, PNG or WebP, up to 1.5 MB",
  '#adminProductForm > .button': "Publish toy"
  , '#adminProductForm > label:nth-of-type(1) > span': "Name (RU)"
  , '#adminProductForm > label:nth-of-type(2) > span': "Name (EN)"
  , '.admin-form-row label:nth-child(1) > span': "Category"
  , '.admin-form-row label:nth-child(2) > span': "Price from, €"
  , '#adminProductForm > label:nth-of-type(3) > span': "Description (RU)"
  , '#adminProductForm > label:nth-of-type(4) > span': "Description (EN)"
  , '#adminProductForm select option:nth-child(1)': "Animals"
  , '#adminProductForm select option:nth-child(2)': "Dolls"
  , '#adminProductForm select option:nth-child(3)': "For babies"
  , '.life-intro .eyebrow': "MORE THAN A TOY"
  , '.life-intro h2': "Her life continues with you"
  , '.life-intro > p:last-child': "Inside every VIORI is a key to the character’s personal world. NFC keeps it simple: one tap opens everything that matters."
  , '.life-step:nth-child(1) h3': "She is born"
  , '.life-step:nth-child(1) p': "The maker creates the toy by hand and writes the first chapter of her story."
  , '.life-step:nth-child(2) h3': "You meet"
  , '.life-step:nth-child(2) p': "Activate the protected NFC passport and welcome the character into your family."
  , '.life-step:nth-child(3) h3': "The story grows"
  , '.life-step:nth-child(3) p': "Keep photos, family memories, audio stories and special dates."
  , '.trust-section .section-heading .eyebrow': "PEACE OF MIND FOR PARENTS"
  , '.trust-section .section-heading h2': "Made with care and transparency"
  , '.trust-section .section-heading > p': "Know the story of the character and every material used to create it."
  , '#cartTitle': "Your bag"
  , '.cart-checkout': "Continue to order"
  , '.trust-card:nth-child(1) h3': "Handmade"
  , '.trust-card:nth-child(1) p': "Every detail is made in small batches and checked before shipping."
  , '.trust-card:nth-child(2) h3': "Clear materials"
  , '.trust-card:nth-child(2) p': "Composition, filling, care instructions and age guidance are shown on every product page."
  , '.trust-card:nth-child(3) h3': "Family privacy"
  , '.trust-card:nth-child(3) p': "NFC does not track the child. The digital passport is available only to the toy’s owner."
  , '.trust-card:nth-child(4) h3': "A long life"
  , '.trust-card:nth-child(4) p': "The story can grow, while the toy can be carefully restored or passed to a new owner."
  , '.faq details:nth-child(1) summary': "How does NFC work?"
  , '.faq details:nth-child(1) p': "Hold a compatible phone near the tag inside the toy. Her protected digital passport opens without installing an app."
  , '.faq details:nth-child(2) summary': "Does a child need an account?"
  , '.faq details:nth-child(2) p': "No. The account and family data are managed by an adult."
  , '.faq details:nth-child(3) summary': "Can I gift or transfer the toy?"
  , '.faq details:nth-child(3) p': "Yes. The owner can securely transfer the digital passport to another adult while keeping selected chapters."
  , '.product-specs div:nth-child(1) span': "Size"
  , '#productModalSize': "about 32 cm"
  , '.product-specs div:nth-child(2) span': "Creation"
  , '#productModalLead': "7–14 days"
  , '.product-specs div:nth-child(3) span': "Included"
  , '.product-specs div:nth-child(3) strong': "NFC passport"
  , '.product-quantity': 'Quantity <input id="productQuantity" type="number" min="1" value="1">'
  , '#modalAddToCart': "Add to bag"
  , '.product-care': "Handmade · Personalisation · Gift wrapping"
  , '.cart-summary span': "Total"
  , '.cart-note': "Payment will be connected in the next stage. For now, prepare the order through the VIORI form."
  , '#checkoutFormView > .eyebrow': "ALMOST THERE"
  , '#checkoutTitle': "Checkout"
  , '#checkoutForm .checkout-grid label:nth-child(1) span': "Full name"
  , '#checkoutForm .checkout-grid label:nth-child(2) span': "Email"
  , '#checkoutForm .checkout-grid label:nth-child(3) span': "Phone"
  , '#checkoutForm .checkout-grid label:nth-child(4) span': "Street and house number"
  , '#checkoutForm .checkout-grid label:nth-child(5) span': "Postcode"
  , '#checkoutForm .checkout-grid label:nth-child(6) span': "City"
  , '.delivery-options legend': "Delivery"
  , '.delivery-options label:nth-of-type(1) strong': "Standard delivery"
  , '.delivery-options label:nth-of-type(1) small': "2–3 working days after production"
  , '.delivery-options label:nth-of-type(2) strong': "Collection"
  , '.delivery-options label:nth-of-type(2) small': "By prior arrangement"
  , '.delivery-options label:nth-of-type(2) b': "Free"
  , '.checkout-total span': "Total to pay"
  , '.payment-preview > span': "Payment method"
  , '.payment-preview small': "Secure online payment will be connected before release."
  , '.checkout-consent span': "I accept the order terms and privacy policy"
  , '#checkoutForm > .button': "Create test order"
  , '#checkoutSuccess .eyebrow': "ORDER CREATED"
  , '#checkoutSuccess h2': "Thank you!"
  , '#checkoutSuccess > p:nth-of-type(3)': "The order is saved in your account. After payments are connected, confirmation will also be sent by email."
  , '#checkoutSuccess > .button': "Continue"
  , '.admin-orders-heading .eyebrow': "ORDERS"
  , '.admin-orders-heading h3': "Latest orders"
  , '.passport-content > .eyebrow': "HER PERSONAL STORY"
  , '.passport-facts div:nth-child(1) span': "Birthday"
  , '.passport-facts div:nth-child(2) span': "Status"
  , '.passport-facts div:nth-child(2) strong': "Part of your family"
  , '.memory-form h3': "Add a new chapter"
  , '.memory-form label:nth-of-type(1) span': "Event title"
  , '.memory-form label:nth-of-type(2) span': "Memory"
  , '.memory-form .button': "Save to the story"
  , '.nfc-admin-heading .eyebrow': "NFC PASSPORTS"
  , '.nfc-admin-heading h3': "Issue a new passport"
  , '.nfc-admin-heading > p:last-child': "Create a protected code for a specific toy. It can be activated by one customer only."
  , '.nfc-issue-form .admin-form-row label:nth-child(1) span': "Character name (RU)"
  , '.nfc-issue-form .admin-form-row label:nth-child(2) span': "Character name (EN)"
  , '.nfc-issue-form > label span': "Customer order"
  , '.nfc-issue-form > label small': "The passport will be linked to this order — no need to type the number"
  , '.nfc-issue-form .button': "Create NFC passport"
  , '#cookieTitle': "Your privacy choice"
  , '#cookieBanner p': "Essential storage keeps language, bag and sign-in working. Optional analytics will be enabled only with your consent."
  , '#cookieBanner > div:first-child > a': "Learn more"
  , '#essentialCookies': "Essential only"
  , '#acceptCookies': "Allow analytics"
  , '.footer-legal a:nth-child(1)': "Terms"
  , '.footer-legal a:nth-child(2)': "Privacy"
  , '.footer-legal a:nth-child(3)': "Returns"
  , '.footer-legal a:nth-child(4)': "Safety"
  , '#openCancellation': "Cancel order"
  , '#openCookieSettings': "Cookies"
  , '#cancellationFormView > .eyebrow': "RIGHT TO CANCEL"
  , '#cancellationTitle': "Cancel an order"
  , '#cancellationFormView > p:not(.eyebrow)': "Send a request — we will record its date and contact you after checking the order status."
  , '#cancellationForm label:nth-of-type(1) span': "Order number"
  , '#cancellationForm label:nth-of-type(2) span': "Order email"
  , '#cancellationForm label:nth-of-type(3) span': "Reason (optional)"
  , '#cancellationForm .button': "Send cancellation request"
  , '#cancellationSuccess .eyebrow': "REQUEST RECEIVED"
  , '#cancellationSuccess h2': "Cancellation registered"
  , '#cancellationSuccess .button': "Close"
  , '.dashboard-tab[data-dashboard-tab="admin-orders"]': "Orders"
  , '.dashboard-tab[data-dashboard-tab="admin-catalog"]': "Catalogue"
  , '.dashboard-tab[data-dashboard-tab="admin-nfc"]': "NFC passports"
  , '.admin-metrics article:nth-child(1) span': "New"
  , '.admin-metrics article:nth-child(1) small': "need attention"
  , '.admin-metrics article:nth-child(2) span': "Orders"
  , '.admin-metrics article:nth-child(2) small': "all time"
  , '.admin-metrics article:nth-child(3) span': "Products"
  , '.admin-metrics article:nth-child(3) small': "in the catalogue"
  , '.admin-metrics article:nth-child(4) small': "passports issued"
  , '#adminAddProductToggle': "Add a toy"
  , '.dashboard-tab[data-dashboard-tab="admin-requests"]': "Requests"
  , '[data-dashboard-page="admin-requests"] .eyebrow': "CUSTOM ORDERS"
  , '[data-dashboard-page="admin-requests"] h3': "Requests from the site"
  , '[data-dashboard-page="admin-requests"] .admin-heading > p:not(.eyebrow)': "Messages from the “Create your own toy” form in the catalogue."
};

const regionalTranslations: Record<"uk" | "nl" | "de" | "fr", Record<string, string>> = {
  uk: {
    "title": "VIORI — в'язані іграшки ручної роботи",
    'meta[name="description"]': "VIORI — в'язані іграшки ручної роботи. Унікальні подарунки, створені з любов'ю.",
    ".main-nav a:nth-child(1)": "Іграшки",
    ".main-nav a:nth-child(2)": "Каталог",
    ".main-nav a:nth-child(3)": "Про бренд",
    ".main-nav a:nth-child(4)": "Контакти",
    ".account-button-text": "Особистий кабінет",
    ".auth-home-button": '<span aria-hidden="true">←</span> На головну',
    ".google-auth-button span": "Продовжити з Google",
    ".auth-divider span": "або через email",
    ".hero-copy .eyebrow": "VIORI · СТВОРЕНО ВРУЧНУ",
    ".hero-copy h1": "Кожна іграшка <em>має власне життя</em>",
    ".hero-text": "VIORI створюється вручну, отримує ім'я, характер і унікальний цифровий паспорт. Торкніться телефоном до NFC-мітки — і відкрийте її історію, спогади та нові розділи.",
    ".hero-actions .button": "Подивитися іграшки",
    ".hero-actions .text-link": "Замовити свою ідею <span>→</span>",
    ".hero-points span:nth-child(1)": "♡ Ручна робота",
    ".hero-points span:nth-child(2)": "♡ Унікальний персонаж",
    ".hero-points span:nth-child(3)": "♡ Особистий NFC-паспорт",
    ".tag-two": "Зроблено з турботою",
    "#catalog .section-heading .eyebrow": "Невелика колекція",
    "#catalog .section-heading h2": "Іграшки VIORI",
    "#catalog .section-heading > p": "Тут можна додати справжні фото, розміри та ціни для кожної іграшки.",
    '.filters [data-filter="all"]': "Усі",
    '.filters [data-filter="animals"]': "Тварини",
    '.filters [data-filter="dolls"]': "Ляльки",
    '.filters [data-filter="baby"]': "Для малюків",
    ".product-image span": "Додайте фото",
    ".product-type": "В'язана іграшка",
    ".product-info h3": "Зайка Мія",
    ".price": "від €29",
    ".product-description": "М'яка іграшка з довгими вушками. Колір одягу можна обрати.",
    ".order-product": "Замовити",
    "#about .eyebrow": "Про майстерню",
    "#about h2": "Кожна петля розповідає історію",
    "#about .story-copy > p:nth-of-type(2)": "VIORI — невелика сімейна майстерня в'язаних іграшок. Масового виробництва тут немає: кожна деталь дбайливо створюється руками.",
    "#about .story-copy > p:nth-of-type(3)": "Ви можете обрати колір, розмір та вбрання іграшки й додати особисту деталь — ім'я, невеликий аксесуар чи подарункову упаковку.",
    ".stats div:nth-child(1) span": "ручна робота",
    ".stats div:nth-child(2) span": "унікальна іграшка",
    ".stats div:nth-child(3) span": "тепла й турботи",
    "#contacts .eyebrow": "Зв'язатися з VIORI",
    "#contacts h2": "Створімо особливу іграшку",
    "#contacts .contact-copy > p:nth-of-type(2)": "Розкажіть, яка іграшка вам сподобалася, або поділіться власною ідеєю. Ми відповімо, обговоримо деталі й порахуємо вартість.",
    ".contact-link:nth-child(1) small": "Напишіть нам у",
    ".contact-link:nth-child(2) small": "Дивіться наш",
    ".small-note": "Перед публікацією замініть номер WhatsApp і посилання Instagram на справжні.",
    '.form-row .label-text': "Ваше ім'я",
    '.order-form > label:nth-of-type(1) .label-text': "Що хочете замовити?",
    '.order-form > label:nth-of-type(2) .label-text': "Побажання",
    "#productSelect option": "Зайка Мія",
    ".form-submit": "Надіслати заявку",
    ".footer > .container > p": '© <span id="year"></span> VIORI. В\'язані іграшки ручної роботи.',
    ".auth-view > .eyebrow": "VIORI WORLD",
    "#accountTitle": "Життя вашої іграшки",
    ".account-intro": "Створіть акаунт, щоб робити замовлення, реєструвати іграшки за NFC-кодом і зберігати їхні історії.",
    '.auth-tab[data-auth-tab="login"]': "Увійти",
    '.auth-tab[data-auth-tab="register"]': "Реєстрація",
    '#loginForm label:nth-child(1) span': "Email",
    '#loginForm label:nth-child(2) span': "Пароль",
    "#loginForm .button": "Увійти",
    ".auth-story-panel .eyebrow": "ЇЇ СВІТ ПОЧИНАЄТЬСЯ ТУТ",
    ".auth-story-panel h2": "Історія, що лишається у вашій родині",
    ".auth-story-panel > div:nth-child(2) > p:last-child": "Один захищений дорослий акаунт тримає разом іграшки, замовлення та дорогі сімейні розділи.",
    ".auth-benefits li:nth-child(1) span": "<strong>Особистий NFC-паспорт</strong><small>Історією іграшки керує лише власник</small>",
    ".auth-benefits li:nth-child(2) span": "<strong>Сімейні спогади</strong><small>Зберігайте важливі моменти та нові розділи</small>",
    ".auth-benefits li:nth-child(3) span": "<strong>Замовлення в одному місці</strong><small>Стежте за персонажем від створення до доставки</small>",
    ".auth-trust": "Захищено Supabase · NFC не відстежує місцезнаходження",
    "#registerForm .registration-progress p": "Безпечна реєстрація займає менше хвилини",
    '#registerForm > label:nth-of-type(1) > span': "Ваше ім'я",
    '#registerForm > label:nth-of-type(2) > span': "Email",
    '#registerForm > label:nth-of-type(3) > span': "Придумайте пароль",
    '#registerForm > label:nth-of-type(4) > span': "Повторіть пароль",
    '#registerForm > label:nth-of-type(5) > span': "Я підтверджую, що акаунтом керує доросла людина",
    '#registerForm > label:nth-of-type(6) > span': 'Я приймаю <a href="legal.html#terms" target="_blank">умови</a> та <a href="legal.html#privacy" target="_blank">політику конфіденційності</a>',
    "#registerForm .registration-submit span": "Створити мій світ VIORI",
    "#registerForm .registration-security": "Ваші дані зашифровані. Ми ніколи не продаємо особисту інформацію.",
    "#registrationSuccess .eyebrow": "МАЙЖЕ ГОТОВО",
    "#registrationSuccess h2": "Підтвердіть email",
    "#registrationSuccess > p:not(.eyebrow)": "Ми надіслали вам захищене посилання. Після підтвердження відкриється ваш особистий світ VIORI.",
    "#registrationSuccess .button": "Перейти до входу",
    ".dashboard-head .eyebrow": "МІЙ КАБІНЕТ",
    ".dashboard-greeting": "Вітаємо,",
    '.dashboard-tab[data-dashboard-tab="toys"]': "Мої іграшки",
    '.dashboard-tab[data-dashboard-tab="orders"]': "Замовлення",
    '.dashboard-tab[data-dashboard-tab="profile"]': "Профіль",
    "#logoutButton": "Вийти",
    ".toy-empty h3": "Тут починається її життя",
    ".toy-empty p": "Піднесіть телефон до NFC-мітки іграшки або введіть код вручну.",
    ".nfc-form label span": "Код активації з картки",
    ".nfc-form .button": "Додати іграшку",
    '.dashboard-page[data-dashboard-page="orders"] > .button': "Обрати нову іграшку",
    '.dashboard-page[data-dashboard-page="profile"] .profile-card:nth-child(1) span': "Ім'я",
    '.dashboard-page[data-dashboard-page="profile"] .profile-card:nth-child(2) span': "Email",
    ".privacy-note": "Ваш кабінет зберігає історії іграшок, замовлення й доступ до особистого світу VIORI.",
    '.admin-heading .eyebrow': "КАТАЛОГ VIORI",
    '.admin-heading h3': "Іграшки на сайті",
    '.admin-heading > p:not(.eyebrow)': "Опубліковані картки бачить кожен відвідувач каталогу.",
    '.image-upload > span': "Фотографія іграшки",
    '.image-upload small': "JPG, PNG або WebP, не більше 1,5 МБ",
    '#adminProductForm > .button': "Опублікувати іграшку",
    '#adminProductForm > label:nth-of-type(1) > span': "Назва (RU)",
    '#adminProductForm > label:nth-of-type(2) > span': "Назва (EN)",
    '.admin-form-row label:nth-child(1) > span': "Категорія",
    '.admin-form-row label:nth-child(2) > span': "Ціна від, €",
    '#adminProductForm > label:nth-of-type(3) > span': "Опис (RU)",
    '#adminProductForm > label:nth-of-type(4) > span': "Опис (EN)",
    '#adminProductForm select option:nth-child(1)': "Тварини",
    '#adminProductForm select option:nth-child(2)': "Ляльки",
    '#adminProductForm select option:nth-child(3)': "Для малюків",
    '.life-intro .eyebrow': "НЕ ПРОСТО ІГРАШКА",
    '.life-intro h2': "Її життя продовжується разом з вами",
    '.life-intro > p:last-child': "Усередині кожної VIORI — ключ до особистого світу персонажа. NFC нічого не ускладнює: один дотик відкриває все важливе.",
    '.life-step:nth-child(1) h3': "Вона народжується",
    '.life-step:nth-child(1) p': "Майстер створює іграшку вручну й записує перший розділ її історії.",
    '.life-step:nth-child(2) h3': "Ви знайомитеся",
    '.life-step:nth-child(2) p': "Активуйте захищений NFC-паспорт і дайте персонажу місце у своїй родині.",
    '.life-step:nth-child(3) h3': "Історія росте",
    '.life-step:nth-child(3) p': "Зберігайте фотографії, сімейні спогади, аудіоказки та особливі дати.",
    '.trust-section .section-heading .eyebrow': "СПОКІЙ ДЛЯ БАТЬКІВ",
    '.trust-section .section-heading h2': "Створено дбайливо й прозоро",
    '.trust-section .section-heading > p': "Ми хочемо, щоб ви знали історію не лише персонажа, а й кожного матеріалу, з якого він створений.",
    '#cartTitle': "Кошик",
    '.cart-checkout': "Оформити замовлення",
    '.trust-card:nth-child(1) h3': "Ручна робота",
    '.trust-card:nth-child(1) p': "Кожна деталь створюється невеликими партіями та перевіряється перед відправкою.",
    '.trust-card:nth-child(2) h3': "Зрозумілі матеріали",
    '.trust-card:nth-child(2) p': "Склад, наповнювач, рекомендації з догляду та вікове маркування вказані на сторінці товару.",
    '.trust-card:nth-child(3) h3': "Перевірка перед відправкою",
    '.trust-card:nth-child(3) p': "Кожна іграшка оглядається вручну: міцність швів, надійність кріплення очей, носа й дрібних деталей.",
    '.trust-card:nth-child(4) h3': "Вікове маркування",
    '.trust-card:nth-child(4) p': "До завершення офіційних випробувань іграшки не призначені для дітей молодших за 3 роки.",
    '.faq details:nth-child(1) summary': "Як працює NFC?",
    '.faq details:nth-child(1) p': "Піднесіть сумісний телефон до мітки всередині іграшки. Її захищений цифровий паспорт відкриється без встановлення застосунку.",
    '.faq details:nth-child(2) summary': "Чи потрібен дитині акаунт?",
    '.faq details:nth-child(2) p': "Ні. Кабінетом і сімейними даними керує доросла людина.",
    '.faq details:nth-child(3) summary': "Чи можна подарувати або передати іграшку?",
    '.faq details:nth-child(3) p': "Так. Власник може безпечно передати цифровий паспорт іншій дорослій людині, зберігши обрані розділи історії.",
    '.product-specs div:nth-child(1) span': "Розмір",
    '#productModalSize': "близько 32 см",
    '.product-specs div:nth-child(2) span': "Створення",
    '#productModalLead': "7–14 днів",
    '.product-specs div:nth-child(3) span': "У комплекті",
    '.product-specs div:nth-child(3) strong': "NFC-паспорт",
    '.product-quantity': 'Кількість <input id="productQuantity" type="number" min="1" value="1">',
    '#modalAddToCart': "Додати в кошик",
    '.product-care': "Ручна робота · Персоналізація · Подарункова упаковка",
    '.cart-summary span': "Разом",
    '.cart-note': "Оплата буде підключена на наступному етапі. Поки що оформіть замовлення через форму VIORI.",
    '#checkoutFormView > .eyebrow': "МАЙЖЕ ГОТОВО",
    '#checkoutTitle': "Оформлення замовлення",
    '#checkoutForm .checkout-grid label:nth-child(1) span': "Повне ім'я",
    '#checkoutForm .checkout-grid label:nth-child(2) span': "Email",
    '#checkoutForm .checkout-grid label:nth-child(3) span': "Телефон",
    '#checkoutForm .checkout-grid label:nth-child(4) span': "Вулиця та номер будинку",
    '#checkoutForm .checkout-grid label:nth-child(5) span': "Індекс",
    '#checkoutForm .checkout-grid label:nth-child(6) span': "Місто",
    '.delivery-options legend': "Доставка",
    '.delivery-options label:nth-of-type(1) strong': "Стандартна доставка",
    '.delivery-options label:nth-of-type(1) small': "2–3 робочі дні після виготовлення",
    '.delivery-options label:nth-of-type(2) strong': "Самовивіз",
    '.delivery-options label:nth-of-type(2) small': "За попередньою домовленістю",
    '.delivery-options label:nth-of-type(2) b': "Безкоштовно",
    '.checkout-total span': "До сплати",
    '.payment-preview > span': "Спосіб оплати",
    '.payment-preview small': "Безпечна онлайн-оплата буде підключена перед релізом.",
    '.checkout-consent span': "Я приймаю умови замовлення та політику конфіденційності",
    '#checkoutForm > .button': "Підтвердити замовлення без оплати",
    '#checkoutSuccess .eyebrow': "ЗАМОВЛЕННЯ СТВОРЕНО",
    '#checkoutSuccess h2': "Дякуємо!",
    '#checkoutSuccess > p:nth-of-type(3)': "Замовлення збережене у вашому кабінеті. Після підключення оплати підтвердження надходитиме й на пошту.",
    '#checkoutSuccess > .button': "Продовжити",
    '.admin-orders-heading .eyebrow': "ЗАМОВЛЕННЯ",
    '.admin-orders-heading h3': "Останні замовлення",
    '.passport-content > .eyebrow': "ЇЇ ОСОБИСТА ІСТОРІЯ",
    '.passport-facts div:nth-child(1) span': "День народження",
    '.passport-facts div:nth-child(2) span': "Статус",
    '.passport-facts div:nth-child(2) strong': "Частина вашої родини",
    '.memory-form h3': "Додати новий розділ",
    '.memory-form label:nth-of-type(1) span': "Назва події",
    '.memory-form label:nth-of-type(2) span': "Спогад",
    '.memory-form .button': "Зберегти в історії",
    '.nfc-admin-heading .eyebrow': "NFC-ПАСПОРТИ",
    '.nfc-admin-heading h3': "Випустити новий паспорт",
    '.nfc-admin-heading > p:last-child': "Створіть захищений код для конкретної іграшки. Активувати його зможе лише один клієнт.",
    '.nfc-issue-form .admin-form-row label:nth-child(1) span': "Ім'я персонажа (RU)",
    '.nfc-issue-form .admin-form-row label:nth-child(2) span': "Ім'я персонажа (EN)",
    '.nfc-issue-form > label span': "Замовлення клієнта",
    '.nfc-issue-form > label small': "Паспорт зв'яжеться з цим замовленням — номер вводити не треба",
    '.nfc-issue-form .button': "Створити NFC-паспорт",
    '#cookieTitle': "Ваш вибір щодо приватності",
    '#cookieBanner p': "Необхідне сховище тримає мову, кошик і вхід. Необов'язкова аналітика вмикається лише за вашою згодою.",
    '#cookieBanner > div:first-child > a': "Докладніше",
    '#essentialCookies': "Лише необхідні",
    '#acceptCookies': "Дозволити аналітику",
    '.footer-legal a:nth-child(1)': "Умови",
    '.footer-legal a:nth-child(2)': "Приватність",
    '.footer-legal a:nth-child(3)': "Повернення",
    '.footer-legal a:nth-child(4)': "Безпека",
    '#openCancellation': "Скасувати замовлення",
    '#openCookieSettings': "Cookies",
    '#cancellationFormView > .eyebrow': "ПРАВО НА СКАСУВАННЯ",
    '#cancellationTitle': "Скасувати замовлення",
    '#cancellationFormView > p:not(.eyebrow)': "Надішліть запит — ми зафіксуємо його дату й зв'яжемося з вами після перевірки статусу замовлення.",
    '#cancellationForm label:nth-of-type(1) span': "Номер замовлення",
    '#cancellationForm label:nth-of-type(2) span': "Email із замовлення",
    '#cancellationForm label:nth-of-type(3) span': "Причина (необов'язково)",
    '#cancellationForm .button': "Надіслати запит на скасування",
    '#cancellationSuccess .eyebrow': "ЗАПИТ ОТРИМАНО",
    '#cancellationSuccess h2': "Скасування зафіксовано",
    '#cancellationSuccess .button': "Закрити",
    '.dashboard-tab[data-dashboard-tab="admin-orders"]': "Замовлення",
    '.dashboard-tab[data-dashboard-tab="admin-catalog"]': "Каталог",
    '.dashboard-tab[data-dashboard-tab="admin-nfc"]': "NFC-паспорти",
    '.admin-metrics article:nth-child(1) span': "Нові",
    '.admin-metrics article:nth-child(1) small': "потребують уваги",
    '.admin-metrics article:nth-child(2) span': "Замовлення",
    '.admin-metrics article:nth-child(2) small': "за весь час",
    '.admin-metrics article:nth-child(3) span': "Товари",
    '.admin-metrics article:nth-child(3) small': "у каталозі",
    '.admin-metrics article:nth-child(4) small': "паспортів випущено",
    '#adminAddProductToggle': "Додати іграшку",
    '.dashboard-tab[data-dashboard-tab="admin-requests"]': "Заявки",
    '[data-dashboard-page="admin-requests"] .eyebrow': "ІНДИВІДУАЛЬНІ ЗАМОВЛЕННЯ",
    '[data-dashboard-page="admin-requests"] h3': "Заявки з сайту",
    '[data-dashboard-page="admin-requests"] .admin-heading > p:not(.eyebrow)': "Повідомлення з форми «Створіть іграшку за своєю ідеєю» в каталозі."
  },
  nl: {
    "title": "VIORI — handgemaakte gehaakte knuffels",
    'meta[name="description"]': "VIORI maakt handgemaakte knuffels met een eigen karakter, verhaal en digitaal NFC-paspoort.",
    ".main-nav a:nth-child(1)": "Knuffels", ".main-nav a:nth-child(2)": "Catalogus", ".main-nav a:nth-child(3)": "Over VIORI", ".main-nav a:nth-child(4)": "Contact",
    ".account-button-text": "Mijn account",
    ".hero-copy .eyebrow": "VIORI · MET DE HAND GEMAAKT", ".hero-copy h1": "Elke knuffel <em>heeft een eigen leven</em>",
    ".hero-text": "Elke VIORI wordt met de hand gemaakt en krijgt een naam, karakter en uniek digitaal paspoort. Tik met je telefoon op de NFC-tag en ontdek het verhaal en de herinneringen.",
    ".hero-actions .button": "Bekijk de knuffels", ".hero-actions .text-link": "Laat jouw idee maken <span>→</span>",
    "#catalog .section-heading .eyebrow": "Een kleine collectie", "#catalog .section-heading h2": "VIORI-knuffels", "#catalog .section-heading > p": "Ontdek handgemaakte personages met een eigen digitaal verhaal.",
    '.filters [data-filter="all"]': "Alles", '.filters [data-filter="animals"]': "Dieren", '.filters [data-filter="dolls"]': "Poppen", '.filters [data-filter="baby"]': "Voor baby's",
    "#about .eyebrow": "Over het atelier", "#about h2": "Elke steek vertelt een verhaal",
    "#contacts .eyebrow": "Neem contact op", "#contacts h2": "Laten we een bijzondere knuffel maken", ".form-submit": "Aanvraag versturen",
    ".auth-view > .eyebrow": "VIORI WORLD", "#accountTitle": "Het leven van jouw knuffel", '.auth-tab[data-auth-tab="login"]': "Inloggen", '.auth-tab[data-auth-tab="register"]': "Registreren",
    "#loginForm .button": "Inloggen", "#registerForm .button": "Account maken", ".dashboard-head .eyebrow": "MIJN ACCOUNT",
    '.dashboard-tab[data-dashboard-tab="toys"]': "Mijn knuffels", '.dashboard-tab[data-dashboard-tab="orders"]': "Bestellingen", '.dashboard-tab[data-dashboard-tab="profile"]': "Profiel", "#logoutButton": "Uitloggen",
    ".cart-checkout": "Bestelling afronden", "#cartTitle": "Winkelmand", "#checkoutTitle": "Bestelling afronden", ".checkout-total span": "Totaal"
  },
  de: {
    "title": "VIORI — handgefertigte Häkeltiere",
    'meta[name="description"]': "VIORI fertigt handgemachte Kuscheltiere mit eigenem Charakter, eigener Geschichte und digitalem NFC-Pass.",
    ".main-nav a:nth-child(1)": "Kuscheltiere", ".main-nav a:nth-child(2)": "Katalog", ".main-nav a:nth-child(3)": "Über VIORI", ".main-nav a:nth-child(4)": "Kontakt",
    ".account-button-text": "Mein Konto",
    ".hero-copy .eyebrow": "VIORI · VON HAND GEFERTIGT", ".hero-copy h1": "Jedes Kuscheltier <em>hat ein eigenes Leben</em>",
    ".hero-text": "Jede VIORI-Figur wird von Hand gefertigt und erhält einen Namen, einen Charakter und einen digitalen Pass. Berühre den NFC-Tag mit deinem Smartphone und entdecke ihre Geschichte.",
    ".hero-actions .button": "Kuscheltiere ansehen", ".hero-actions .text-link": "Eigene Idee anfragen <span>→</span>",
    "#catalog .section-heading .eyebrow": "Eine kleine Kollektion", "#catalog .section-heading h2": "VIORI-Kuscheltiere", "#catalog .section-heading > p": "Entdecke handgefertigte Charaktere mit ihrer eigenen digitalen Geschichte.",
    '.filters [data-filter="all"]': "Alle", '.filters [data-filter="animals"]': "Tiere", '.filters [data-filter="dolls"]': "Puppen", '.filters [data-filter="baby"]': "Für Babys",
    "#about .eyebrow": "Über das Atelier", "#about h2": "Jede Masche erzählt eine Geschichte",
    "#contacts .eyebrow": "VIORI kontaktieren", "#contacts h2": "Lass uns ein besonderes Kuscheltier erschaffen", ".form-submit": "Anfrage senden",
    ".auth-view > .eyebrow": "VIORI WORLD", "#accountTitle": "Das Leben deines Kuscheltiers", '.auth-tab[data-auth-tab="login"]': "Anmelden", '.auth-tab[data-auth-tab="register"]': "Registrieren",
    "#loginForm .button": "Anmelden", "#registerForm .button": "Konto erstellen", ".dashboard-head .eyebrow": "MEIN KONTO",
    '.dashboard-tab[data-dashboard-tab="toys"]': "Meine Kuscheltiere", '.dashboard-tab[data-dashboard-tab="orders"]': "Bestellungen", '.dashboard-tab[data-dashboard-tab="profile"]': "Profil", "#logoutButton": "Abmelden",
    ".cart-checkout": "Zur Bestellung", "#cartTitle": "Warenkorb", "#checkoutTitle": "Bestellung abschließen", ".checkout-total span": "Gesamt"
  },
  fr: {
    "title": "VIORI — peluches au crochet faites main",
    'meta[name="description"]': "VIORI crée des peluches faites main avec leur propre caractère, leur histoire et un passeport NFC numérique.",
    ".main-nav a:nth-child(1)": "Peluches", ".main-nav a:nth-child(2)": "Catalogue", ".main-nav a:nth-child(3)": "À propos", ".main-nav a:nth-child(4)": "Contact",
    ".account-button-text": "Mon compte",
    ".hero-copy .eyebrow": "VIORI · CRÉÉ À LA MAIN", ".hero-copy h1": "Chaque peluche <em>a sa propre vie</em>",
    ".hero-text": "Chaque VIORI est créée à la main et reçoit un nom, un caractère et un passeport numérique unique. Touchez la puce NFC avec votre téléphone pour découvrir son histoire.",
    ".hero-actions .button": "Voir les peluches", ".hero-actions .text-link": "Créer votre idée <span>→</span>",
    "#catalog .section-heading .eyebrow": "Une petite collection", "#catalog .section-heading h2": "Peluches VIORI", "#catalog .section-heading > p": "Découvrez des personnages faits main avec leur propre histoire numérique.",
    '.filters [data-filter="all"]': "Toutes", '.filters [data-filter="animals"]': "Animaux", '.filters [data-filter="dolls"]': "Poupées", '.filters [data-filter="baby"]': "Pour bébés",
    "#about .eyebrow": "À propos de l’atelier", "#about h2": "Chaque maille raconte une histoire",
    "#contacts .eyebrow": "Contacter VIORI", "#contacts h2": "Créons une peluche exceptionnelle", ".form-submit": "Envoyer la demande",
    ".auth-view > .eyebrow": "VIORI WORLD", "#accountTitle": "La vie de votre peluche", '.auth-tab[data-auth-tab="login"]': "Connexion", '.auth-tab[data-auth-tab="register"]': "Inscription",
    "#loginForm .button": "Se connecter", "#registerForm .button": "Créer un compte", ".dashboard-head .eyebrow": "MON COMPTE",
    '.dashboard-tab[data-dashboard-tab="toys"]': "Mes peluches", '.dashboard-tab[data-dashboard-tab="orders"]': "Commandes", '.dashboard-tab[data-dashboard-tab="profile"]': "Profil", "#logoutButton": "Déconnexion",
    ".cart-checkout": "Finaliser la commande", "#cartTitle": "Panier", "#checkoutTitle": "Finaliser la commande", ".checkout-total span": "Total"
  }
};

const translatedElements = new Map<string, { html: string; content: string | null }>();
Object.keys(englishTranslations).forEach((selector) => {
  const element = document.querySelector(selector);
  if (!element) return;
  translatedElements.set(selector, {
    html: element.innerHTML,
    content: element.getAttribute("content")
  });
});

const languageButtons = document.querySelectorAll<HTMLButtonElement>(".language-button");
const languageSwitcher = document.querySelector<HTMLElement>(".language-switcher");
const languageMenuButton = document.getElementById("languageMenuButton") as HTMLButtonElement | null;
const languageLabels: Record<Language, string> = { ru: "Русский", uk: "Українська", en: "English", nl: "Nederlands", de: "Deutsch", fr: "Français" };
let currentLanguage: Language = "ru";

function setLanguage(language: string | undefined) {
  currentLanguage = (["ru", "uk", "en", "nl", "de", "fr"] as Language[]).includes(language as Language) ? language as Language : "ru";
  document.documentElement.lang = currentLanguage;

  translatedElements.forEach((original, selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    const regional = currentLanguage in regionalTranslations ? regionalTranslations[currentLanguage as "uk" | "nl" | "de" | "fr"][selector] : undefined;
    const value = currentLanguage === "ru" ? original.html : (regional || englishTranslations[selector]);
    if (element.matches("meta")) {
      element.setAttribute("content", currentLanguage === "ru" ? (original.content || "") : (regional || englishTranslations[selector]));
    } else {
      element.innerHTML = value;
    }
  });

  const bunnyName = currentLanguage !== "ru" ? "Mia the Bunny" : translatedElements.get(".product-info h3")?.html;
  document.querySelector(".order-product")?.setAttribute("data-product", bunnyName || "");
  const nameInput = document.querySelector('input[name="name"]');
  const messageInput = document.querySelector('textarea[name="message"]');
  nameInput?.setAttribute("placeholder", currentLanguage !== "ru" ? "For example, Anna" : "Например, Анна");
  messageInput?.setAttribute("placeholder", currentLanguage !== "ru" ? "Tell us your preferred colour, size and any other details" : "Напишите желаемый цвет, размер и другие детали");
  document.querySelector('#loginForm input[name="password"]')?.setAttribute("placeholder", currentLanguage !== "ru" ? "At least 8 characters" : "Не менее 8 символов");
  document.querySelector('#registerForm input[name="password"]')?.setAttribute("placeholder", currentLanguage !== "ru" ? "At least 8 characters" : "Не менее 8 символов");
  document.querySelector('#registerForm input[name="name"]')?.setAttribute("placeholder", currentLanguage !== "ru" ? "For example, Anna" : "Например, Анна");
  document.querySelector('#nfcForm input[name="code"]')?.setAttribute("placeholder", currentLanguage !== "ru" ? "For example, VIORI-MIA-001" : "Например, VIORI-MIA-001");
  document.querySelector(".brand")?.setAttribute("aria-label", currentLanguage !== "ru" ? "VIORI — home" : "VIORI — главная");
  mainNav?.setAttribute("aria-label", currentLanguage !== "ru" ? "Main navigation" : "Основная навигация");
  menuButton?.setAttribute("aria-label", currentLanguage !== "ru" ? "Open menu" : "Открыть меню");
  document.querySelector(".language-switcher")?.setAttribute("aria-label", currentLanguage !== "ru" ? "Choose language" : "Выбор языка");

  languageButtons.forEach((button) => {
    const active = button.dataset.language === currentLanguage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-checked", String(active));
  });
  const currentLabel = document.getElementById("currentLanguageLabel");
  if (currentLabel) currentLabel.textContent = languageLabels[currentLanguage];

  document.getElementById("year")!.textContent = String(new Date().getFullYear());
  localStorage.setItem("viori-language", currentLanguage);
  renderCatalogProducts();
  renderCart();
  if (getSession()) renderAccount();
}

function closeLanguageMenu(): void {
  languageSwitcher?.classList.remove("open");
  languageMenuButton?.setAttribute("aria-expanded", "false");
}

languageMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = !languageSwitcher?.classList.contains("open");
  languageSwitcher?.classList.toggle("open", open);
  languageMenuButton.setAttribute("aria-expanded", String(open));
  if (open) document.querySelector<HTMLButtonElement>(`.language-button[data-language="${currentLanguage}"]`)?.focus();
});
languageButtons.forEach((button) => button.addEventListener("click", () => { setLanguage(button.dataset.language); closeLanguageMenu(); languageMenuButton?.focus(); }));
document.addEventListener("click", (event) => { if (!languageSwitcher?.contains(event.target as Node)) closeLanguageMenu(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeLanguageMenu(); });

menuButton?.addEventListener("click", () => {
  const isOpen = mainNav?.classList.toggle("open") || false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

function closeMobileMenu(): void {
  mainNav?.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}
document.addEventListener("click", (event) => {
  const target = event.target as Node;
  if (mainNav?.classList.contains("open") && !mainNav.contains(target) && !menuButton?.contains(target)) closeMobileMenu();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMobileMenu(); });
window.addEventListener("resize", () => { if (window.innerWidth > 980) closeMobileMenu(); });
window.addEventListener("scroll", closeMobileMenu, { passive: true });

const filters = document.querySelectorAll<HTMLButtonElement>(".filter");

filters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    filters.forEach((button) => button.classList.remove("active"));
    filterButton.classList.add("active");

    const selected = filterButton.dataset.filter;
    document.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {
      const show = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("hidden", !show);
    });
  });
});

const productSelect = document.getElementById("productSelect") as HTMLSelectElement | null;
document.querySelectorAll<HTMLButtonElement>(".order-product").forEach((button) => {
  button.addEventListener("click", () => {
    if (productSelect) productSelect.value = button.dataset.product || "";
    document.getElementById("contacts")?.scrollIntoView({ behavior: "smooth" });
  });
});

const orderForm = document.getElementById("orderForm") as HTMLFormElement | null;
const formStatus = document.getElementById("formStatus");

// Замените на настоящий номер WhatsApp в международном формате без "+" и пробелов.
// Пример для Нидерландов: 31612345678
const WHATSAPP_NUMBER = "31000000000";

orderForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(orderForm);

  const activeEmail = localStorage.getItem("viori-session");
  if (activeEmail) {
    const accounts = JSON.parse(localStorage.getItem("viori-accounts") || "{}");
    const account = accounts[activeEmail];
    if (account) {
      account.orders ||= [];
      account.orders.unshift({ product: data.get("product"), date: new Date().toISOString(), status: "request" });
      localStorage.setItem("viori-accounts", JSON.stringify(accounts));
    }
  }

  const text = currentLanguage !== "ru" ? [
    "Hello! I would like to order a VIORI toy.",
    "",
    `Name: ${data.get("name")}`,
    `Toy: ${data.get("product")}`,
    `Preferences: ${data.get("message") || "not specified"}`
  ].join("\n") : [
    "Здравствуйте! Хочу заказать игрушку VIORI.",
    "",
    `Имя: ${data.get("name")}`,
    `Контакт: ${data.get("contact")}`,
    `Игрушка: ${data.get("product")}`,
    `Пожелания: ${data.get("message") || "не указаны"}`
  ].join("\n");

  if (WHATSAPP_NUMBER === "31000000000") {
    if (formStatus) formStatus.textContent = currentLanguage !== "ru"
      ? "The form works. Add the real WhatsApp number in script.js before publishing."
      : "Форма работает. Перед публикацией укажите настоящий номер WhatsApp в файле script.js.";
    return;
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

const accountModal = document.getElementById("accountModal");
const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const accountStatus = document.getElementById("accountStatus");
let adminLayoutInitialized = false;

function safeText(value: unknown): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
  return String(value ?? "").replace(/[&<>'"]/g, (char) => entities[char] || char);
}

// The code below is retained only as an offline design preview. Production uses
// Supabase and must never store passwords, roles, orders, or NFC claims locally.
if (!supabase) {

function getAccounts(): Accounts {
  try { return JSON.parse(localStorage.getItem("viori-accounts") || "{}") as Accounts; }
  catch { return {}; }
}

function saveAccounts(accounts: Accounts): void { localStorage.setItem("viori-accounts", JSON.stringify(accounts)); }
function getSession(): string | null { return localStorage.getItem("viori-session"); }

function openAccount() {
  accountModal?.classList.add("open");
  accountModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-open");
  renderAccount();
  setTimeout(() => accountModal?.querySelector<HTMLElement>("button, input")?.focus(), 50);
}

function closeAccount() {
  accountModal?.classList.remove("open");
  accountModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-open");
  adminLayoutInitialized = false;
}

document.getElementById("openAccount")?.addEventListener("click", openAccount);
document.querySelectorAll("[data-close-account]").forEach((button) => button.addEventListener("click", closeAccount));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAccount(); });

document.querySelectorAll<HTMLButtonElement>(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((item) => item.classList.toggle("active", item === tab));
    document.getElementById("loginForm")?.classList.toggle("hidden", tab.dataset.authTab !== "login");
    document.getElementById("registerForm")?.classList.toggle("hidden", tab.dataset.authTab !== "register");
    if (accountStatus) accountStatus.textContent = "";
  });
});

document.getElementById("registerForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const email = String(data.get("email")).trim().toLowerCase();
  const accounts = getAccounts();
  if (accounts[email]) {
    if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "An account with this email already exists." : "Аккаунт с таким email уже существует.";
    return;
  }
  const hasAdmin = Object.values(accounts).some((account) => account.role === "admin");
  accounts[email] = { name: String(data.get("name")).trim(), email, password: String(data.get("password")), toys: [], orders: [], role: hasAdmin ? "customer" : "admin" };
  saveAccounts(accounts);
  localStorage.setItem("viori-session", email);
  form.reset();
  renderAccount();
});

document.getElementById("loginForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const email = String(data.get("email")).trim().toLowerCase();
  const account = getAccounts()[email];
  if (!account || account.password !== String(data.get("password"))) {
    if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Incorrect email or password." : "Неверный email или пароль.";
    return;
  }
  localStorage.setItem("viori-session", email);
  form.reset();
  renderAccount();
});

document.getElementById("logoutButton")?.addEventListener("click", () => {
  localStorage.removeItem("viori-session");
  renderAccount();
});

function switchDashboardPage(pageName: string): void {
  document.querySelectorAll<HTMLButtonElement>(".dashboard-tab").forEach((item) => item.classList.toggle("active", item.dataset.dashboardTab === pageName));
  document.querySelectorAll<HTMLElement>("[data-dashboard-page]").forEach((page) => page.classList.toggle("hidden", page.dataset.dashboardPage !== pageName));
}

document.querySelectorAll<HTMLButtonElement>(".dashboard-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    switchDashboardPage(tab.dataset.dashboardTab || "toys");
  });
});

// Форма добавления игрушки открывается по кнопке, а не занимает весь экран каталога.
const addProductToggle = document.getElementById("adminAddProductToggle");
addProductToggle?.addEventListener("click", () => {
  const form = document.getElementById("adminProductForm");
  const opened = form ? !form.classList.toggle("hidden") : false;
  addProductToggle.setAttribute("aria-expanded", String(opened));
  if (opened) form?.querySelector<HTMLInputElement>("input")?.focus();
});

function getNfcPassports(): NfcPassport[] {
  try { return JSON.parse(localStorage.getItem("viori-nfc-passports") || "[]") as NfcPassport[]; }
  catch { return []; }
}

function saveNfcPassports(passports: NfcPassport[]): void {
  localStorage.setItem("viori-nfc-passports", JSON.stringify(passports));
}

function claimNfcPassport(codeValue: string, email: string): "claimed" | "owned" | "taken" | "invalid" {
  const code = codeValue.trim().toUpperCase();
  const passports = getNfcPassports();
  const passport = passports.find((item) => item.code === code);
  if (!passport) return "invalid";
  if (passport.ownerEmail && passport.ownerEmail !== email) return "taken";
  const accounts = getAccounts();
  const account = accounts[email];
  if (!account) return "invalid";
  if (account.toys.some((toy) => toy.code === code)) return "owned";
  const now = new Date().toISOString();
  passport.ownerEmail = email;
  passport.claimedAt = now;
  account.toys.unshift({ code, name: currentLanguage !== "ru" ? passport.nameEn : passport.nameRu, nameRu: passport.nameRu, nameEn: passport.nameEn, born: now, memories: [] });
  saveNfcPassports(passports);
  saveAccounts(accounts);
  return "claimed";
}

document.getElementById("nfcForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = getSession();
  if (!email) return;
  const form = event.currentTarget as HTMLFormElement;
  const code = String(new FormData(form).get("code")).trim().toUpperCase();
  const status = document.getElementById("nfcStatus");
  const result = claimNfcPassport(code, email);
  const messages = {
    claimed: currentLanguage !== "ru" ? "The passport is activated. Welcome to the VIORI world." : "Паспорт активирован. Добро пожаловать в мир VIORI.",
    owned: currentLanguage !== "ru" ? "This toy is already in your collection." : "Эта игрушка уже есть в вашей коллекции.",
    taken: currentLanguage !== "ru" ? "This passport has already been activated by another owner." : "Этот паспорт уже активирован другим владельцем.",
    invalid: currentLanguage !== "ru" ? "Passport not found. Check the code and try again." : "Паспорт не найден. Проверьте код и попробуйте снова."
  };
  if (status) status.textContent = messages[result];
  if (result !== "claimed") return;
  form.reset();
  renderAccount();
});

function getCatalogProducts(): CatalogProduct[] {
  try { return JSON.parse(localStorage.getItem("viori-catalog-products") || "[]") as CatalogProduct[]; }
  catch { return []; }
}

function saveCatalogProducts(products: CatalogProduct[]): void {
  localStorage.setItem("viori-catalog-products", JSON.stringify(products));
}

function renderCatalogProducts(): void {
  document.querySelectorAll(".admin-added").forEach((element) => element.remove());
  document.querySelectorAll("#productSelect option[data-admin-product]").forEach((element) => element.remove());
  const grid = document.querySelector(".product-grid");
  const select = document.getElementById("productSelect");
  if (!grid || !select) return;

  getCatalogProducts().forEach((product) => {
    const name = currentLanguage !== "ru" ? product.nameEn : product.nameRu;
    const description = currentLanguage !== "ru" ? product.descriptionEn : product.descriptionRu;
    const card = document.createElement("article");
    card.className = "product-card admin-added visible";
    card.dataset.category = product.category;
    const activeFilter = document.querySelector<HTMLButtonElement>(".filter.active")?.dataset.filter || "all";
    card.classList.toggle("hidden", activeFilter !== "all" && activeFilter !== product.category);
    card.innerHTML = `<div class="product-image"><img src="${product.image}" alt="${safeText(name)}"></div><div class="product-info"><div><p class="product-type">${currentLanguage !== "ru" ? "Crochet toy" : "Вязаная игрушка"}</p><h3>${safeText(name)}</h3></div><p class="price">${currentLanguage !== "ru" ? "from" : "от"} €${product.price}</p></div><p class="product-description">${safeText(description)}</p><div class="card-actions"><button class="card-button view-product" type="button" data-catalog-product="${product.id}">${currentLanguage !== "ru" ? "Details" : "Подробнее"}</button><button class="card-button add-to-cart" type="button" data-catalog-product="${product.id}">${currentLanguage !== "ru" ? "Add to bag" : "В корзину"}</button></div>`;
    grid.appendChild(card);

    const option = document.createElement("option");
    option.dataset.adminProduct = product.id;
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

let activeShopProduct: ShopProduct | null = null;

// Персонажи, свёрстанные прямо в каталоге. Тот же список продублирован
// в site-pages.js — подстраницы не подключают этот бандл. Меняя цены или
// имена здесь, поправьте и там, иначе корзина покажет разные данные.
const staticShopProducts: Record<string, { nameRu: string; nameEn: string; price: number; descriptionRu: string; descriptionEn: string }> = {
  mia: {
    nameRu: "Зайка Мия", nameEn: "Mia the Bunny", price: 29,
    descriptionRu: "Нежная зайка с длинными ушками, собственным характером и личным NFC-паспортом. Выберите цвет одежды и сделайте её историю своей.",
    descriptionEn: "A gentle bunny with long ears, her own character and a personal NFC passport. Choose the colour of her outfit and make her story yours."
  },
  teo: {
    nameRu: "Мишка Тео", nameEn: "Theo the Bear", price: 34,
    descriptionRu: "Готовый персонаж с вязаным шарфом и личным NFC-паспортом. Высота около 30 см.",
    descriptionEn: "A ready character with a knitted scarf and a personal NFC passport. About 30 cm tall."
  }
};

function staticShopProduct(key: string): ShopProduct | null {
  const item = staticShopProducts[key];
  if (!item) return null;
  return {
    id: `static:${key}`,
    name: currentLanguage !== "ru" ? item.nameEn : item.nameRu,
    price: item.price,
    description: currentLanguage !== "ru" ? item.descriptionEn : item.descriptionRu,
    image: ""
  };
}

function resolveShopProduct(button: HTMLElement): ShopProduct | null {
  const staticKey = button.dataset.staticProduct;
  if (staticKey) return staticShopProduct(staticKey);
  const id = button.dataset.catalogProduct;
  const product = getCatalogProducts().find((item) => item.id === id);
  if (!product) return null;
  return { id: `catalog:${product.id}`, name: currentLanguage !== "ru" ? product.nameEn : product.nameRu, price: product.price, description: currentLanguage !== "ru" ? product.descriptionEn : product.descriptionRu, image: product.image };
}

function resolveShopProductById(id: string): ShopProduct | null {
  if (id.startsWith("static:")) return staticShopProduct(id.slice(7));
  const product = getCatalogProducts().find((item) => `catalog:${item.id}` === id);
  return product ? { id, name: currentLanguage !== "ru" ? product.nameEn : product.nameRu, price: product.price, description: currentLanguage !== "ru" ? product.descriptionEn : product.descriptionRu, image: product.image } : null;
}

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("viori-cart") || "[]") as CartItem[]; }
  catch { return []; }
}

function saveCart(cart: CartItem[]): void {
  localStorage.setItem("viori-cart", JSON.stringify(cart));
  renderCart();
}

function addProductToCart(product: ShopProduct, quantity = 1): void {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += quantity;
  else cart.push({ id: product.id, quantity });
  saveCart(cart);
  openCart();
}

function openProduct(product: ShopProduct): void {
  activeShopProduct = product;
  document.getElementById("productModalName")!.textContent = product.name;
  document.getElementById("productModalPrice")!.textContent = `${currentLanguage !== "ru" ? "from" : "от"} €${product.price}`;
  document.getElementById("productModalDescription")!.textContent = product.description;
  const image = document.getElementById("productModalImage") as HTMLElement;
  image.style.backgroundImage = product.image ? `url("${product.image}")` : "linear-gradient(145deg,#e9d6c6,#f9eee5)";
  document.getElementById("productModal")?.classList.add("open");
  document.getElementById("productModal")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("shop-open");
}

function closeProduct(): void {
  document.getElementById("productModal")?.classList.remove("open");
  document.getElementById("productModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shop-open");
}

function openCart(): void {
  renderCart();
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartDrawer")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("shop-open");
}

function closeCart(): void {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartDrawer")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shop-open");
}

function renderCart(): void {
  const cart = getCart();
  const items = cart.map((item) => ({ item, product: resolveShopProductById(item.id) })).filter((entry): entry is { item: CartItem; product: ShopProduct } => Boolean(entry.product));
  document.getElementById("cartCount")!.textContent = String(items.reduce((sum, entry) => sum + entry.item.quantity, 0));
  document.getElementById("cartTotal")!.textContent = `€${items.reduce((sum, entry) => sum + entry.product.price * entry.item.quantity, 0)}`;
  const container = document.getElementById("cartItems")!;
  container.innerHTML = items.length ? items.map(({ item, product }) => `<article class="cart-item"><div class="cart-item-image"${product.image ? ` style="background-image:url('${product.image}')"` : ""}></div><div><strong>${safeText(product.name)}</strong><span>${item.quantity} × €${product.price}</span></div><button class="cart-remove" type="button" data-remove-cart="${safeText(item.id)}" aria-label="${currentLanguage !== "ru" ? "Remove" : "Удалить"}">×</button></article>`).join("") : `<div class="cart-empty">${currentLanguage !== "ru" ? "Your future character is waiting for you." : "Ваш будущий персонаж ждёт встречи с вами."}</div>`;
  container.querySelectorAll<HTMLButtonElement>("[data-remove-cart]").forEach((button) => button.addEventListener("click", () => saveCart(cart.filter((item) => item.id !== button.dataset.removeCart))));
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const productButton = target.closest<HTMLElement>(".view-product, .add-to-cart");
  if (!productButton) return;
  const product = resolveShopProduct(productButton);
  if (!product) return;
  if (productButton.classList.contains("view-product")) openProduct(product);
  else addProductToCart(product);
});

document.getElementById("openCart")?.addEventListener("click", openCart);
document.querySelectorAll("[data-close-product]").forEach((button) => button.addEventListener("click", closeProduct));
document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeCart));
document.getElementById("modalAddToCart")?.addEventListener("click", () => {
  const quantity = Math.max(1, Number((document.getElementById("productQuantity") as HTMLInputElement).value) || 1);
  closeProduct();
  if (activeShopProduct) addProductToCart(activeShopProduct, quantity);
});
document.getElementById("cartCheckout")?.addEventListener("click", () => {
  if (!getCart().length) return;
  closeCart();
  openCheckout();
});

function getCheckoutOrders(): CheckoutOrder[] {
  try { return JSON.parse(localStorage.getItem("viori-shop-orders") || "[]") as CheckoutOrder[]; }
  catch { return []; }
}

function saveCheckoutOrders(orders: CheckoutOrder[]): void {
  localStorage.setItem("viori-shop-orders", JSON.stringify(orders));
}

function checkoutAmount(): { subtotal: number; delivery: number; total: number } {
  const subtotal = getCart().reduce((sum, item) => sum + (resolveShopProductById(item.id)?.price || 0) * item.quantity, 0);
  const selected = document.querySelector<HTMLInputElement>('#checkoutForm input[name="delivery"]:checked')?.value || "standard";
  const delivery = selected === "pickup" ? 0 : 4.95;
  return { subtotal, delivery, total: subtotal + delivery };
}

function updateCheckoutTotal(): void {
  document.getElementById("checkoutTotal")!.textContent = `€${checkoutAmount().total.toFixed(2)}`;
}

function openCheckout(): void {
  const modal = document.getElementById("checkoutModal");
  const form = document.getElementById("checkoutForm") as HTMLFormElement;
  document.getElementById("checkoutFormView")?.classList.remove("hidden");
  document.getElementById("checkoutSuccess")?.classList.add("hidden");
  const session = getSession();
  const account = session ? getAccounts()[session] : undefined;
  if (account) {
    (form.elements.namedItem("name") as HTMLInputElement).value = account.name;
    (form.elements.namedItem("email") as HTMLInputElement).value = account.email;
  }
  updateCheckoutTotal();
  modal?.classList.add("open");
  modal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("shop-open");
}

function closeCheckout(): void {
  document.getElementById("checkoutModal")?.classList.remove("open");
  document.getElementById("checkoutModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shop-open");
}

document.querySelectorAll("[data-close-checkout]").forEach((button) => button.addEventListener("click", closeCheckout));
document.querySelectorAll<HTMLInputElement>('#checkoutForm input[name="delivery"]').forEach((input) => input.addEventListener("change", updateCheckoutTotal));
document.querySelectorAll<HTMLButtonElement>(".payment-method").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".payment-method").forEach((item) => item.classList.toggle("active", item === button));
}));

document.getElementById("checkoutForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const cart = getCart();
  const items = cart.map((item) => {
    const product = resolveShopProductById(item.id);
    return product ? { id: item.id, name: product.name, price: product.price, quantity: item.quantity } : null;
  }).filter((item): item is CheckoutOrder["items"][number] => Boolean(item));
  if (!items.length) return;
  const amount = checkoutAmount();
  const now = new Date();
  const number = `VIO-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;
  const order: CheckoutOrder = {
    number,
    createdAt: now.toISOString(),
    customer: { name: String(data.get("name")), email: String(data.get("email")), phone: String(data.get("phone")), address: String(data.get("address")), postcode: String(data.get("postcode")).toUpperCase(), city: String(data.get("city")) },
    items,
    delivery: String(data.get("delivery")) as CheckoutOrder["delivery"],
    deliveryPrice: amount.delivery,
    total: amount.total,
    payment: document.querySelector(".payment-method.active")?.textContent?.trim() || "iDEAL",
    status: "new"
  };
  const orders = getCheckoutOrders();
  orders.unshift(order);
  saveCheckoutOrders(orders);

  const session = getSession();
  const accounts = getAccounts();
  let account = session ? accounts[session] : undefined;
  if (account) {
    account.orders.unshift({ product: items.map((item) => `${item.name} × ${item.quantity}`).join(", "), date: now.toISOString(), status: order.status });
    saveAccounts(accounts);
  }

  saveCart([]);
  form.reset();
  document.getElementById("checkoutOrderNumber")!.textContent = number;
  document.getElementById("checkoutFormView")?.classList.add("hidden");
  document.getElementById("checkoutSuccess")?.classList.remove("hidden");
  renderAdminOrders();
});

function setCookiePreference(preference: "essential" | "analytics"): void {
  localStorage.setItem("viori-cookie-preference", JSON.stringify({ preference, updatedAt: new Date().toISOString() }));
  document.getElementById("cookieBanner")?.classList.remove("open");
}

function openCookieSettings(): void {
  document.getElementById("cookieBanner")?.classList.add("open");
}

document.getElementById("essentialCookies")?.addEventListener("click", () => setCookiePreference("essential"));
document.getElementById("acceptCookies")?.addEventListener("click", () => setCookiePreference("analytics"));
document.getElementById("openCookieSettings")?.addEventListener("click", openCookieSettings);
if (!localStorage.getItem("viori-cookie-preference")) openCookieSettings();

function getCancellationRequests(): CancellationRequest[] {
  try { return JSON.parse(localStorage.getItem("viori-cancellation-requests") || "[]") as CancellationRequest[]; }
  catch { return []; }
}

function openCancellation(): void {
  document.getElementById("cancellationFormView")?.classList.remove("hidden");
  document.getElementById("cancellationSuccess")?.classList.add("hidden");
  document.getElementById("cancellationModal")?.classList.add("open");
  document.getElementById("cancellationModal")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("shop-open");
}

function closeCancellation(): void {
  document.getElementById("cancellationModal")?.classList.remove("open");
  document.getElementById("cancellationModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shop-open");
}

document.getElementById("openCancellation")?.addEventListener("click", openCancellation);
document.querySelectorAll("[data-close-cancellation]").forEach((button) => button.addEventListener("click", closeCancellation));
document.getElementById("cancellationForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const orderNumber = String(data.get("orderNumber")).trim().toUpperCase();
  const email = String(data.get("email")).trim().toLowerCase();
  const orders = getCheckoutOrders();
  const order = orders.find((item) => item.number === orderNumber && item.customer.email.toLowerCase() === email);
  const status = document.getElementById("cancellationStatus");
  if (!order) {
    if (status) status.textContent = currentLanguage !== "ru" ? "No matching order was found." : "Заказ с такими данными не найден.";
    return;
  }
  const requests = getCancellationRequests();
  const reference = `CAN-${String(Date.now()).slice(-8)}`;
  requests.unshift({ reference, orderNumber, email, reason: String(data.get("reason")).trim(), createdAt: new Date().toISOString() });
  localStorage.setItem("viori-cancellation-requests", JSON.stringify(requests));
  order.status = "cancelled";
  saveCheckoutOrders(orders);
  form.reset();
  document.getElementById("cancellationReference")!.textContent = `${currentLanguage !== "ru" ? "Reference" : "Номер обращения"}: ${reference}`;
  document.getElementById("cancellationFormView")?.classList.add("hidden");
  document.getElementById("cancellationSuccess")?.classList.remove("hidden");
  renderAdminOrders();
  renderAccount();
});

if (new URLSearchParams(window.location.search).has("cancel")) {
  openCancellation();
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("cancel");
  history.replaceState({}, "", cleanUrl);
}

const adminProductForm = document.getElementById("adminProductForm") as HTMLFormElement | null;
adminProductForm?.querySelector<HTMLInputElement>('input[name="image"]')?.addEventListener("change", (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  const preview = document.getElementById("adminImagePreview");
  if (!file || !preview) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    preview.style.backgroundImage = `url("${String(reader.result)}")`;
    preview.classList.remove("hidden");
  });
  reader.readAsDataURL(file);
});

adminProductForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = getSession();
  const account = session ? getAccounts()[session] : undefined;
  const status = document.getElementById("adminStatus");
  if (account?.role !== "admin") return;
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const file = data.get("image");
  if (!(file instanceof File) || !file.size) return;
  if (file.size > 1.5 * 1024 * 1024) {
    if (status) status.textContent = currentLanguage !== "ru" ? "The image is larger than 1.5 MB." : "Изображение больше 1,5 МБ.";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const products = getCatalogProducts();
    products.unshift({
      id: crypto.randomUUID?.() || `${Date.now()}`,
      nameRu: String(data.get("nameRu")).trim(),
      nameEn: String(data.get("nameEn")).trim(),
      category: String(data.get("category")) as CatalogProduct["category"],
      price: Number(data.get("price")),
      descriptionRu: String(data.get("descriptionRu")).trim(),
      descriptionEn: String(data.get("descriptionEn")).trim(),
      image: String(reader.result)
    });
    try {
      saveCatalogProducts(products);
      form.reset();
      document.getElementById("adminImagePreview")?.classList.add("hidden");
      if (status) status.textContent = currentLanguage !== "ru" ? "The toy has been published." : "Игрушка опубликована.";
      renderCatalogProducts();
      renderAdminProducts();
      renderAdminOverview();
    } catch {
      if (status) status.textContent = currentLanguage !== "ru" ? "Browser storage is full. Use a smaller image." : "Хранилище браузера заполнено. Загрузите изображение меньшего размера.";
    }
  });
  reader.readAsDataURL(file);
});

function renderAdminProducts(): void {
  const container = document.getElementById("adminProducts");
  if (!container) return;
  container.innerHTML = getCatalogProducts().map((product) => `<div class="admin-product-item"><img src="${product.image}" alt=""><div><strong>${safeText(currentLanguage !== "ru" ? product.nameEn : product.nameRu)}</strong><span>€${product.price}</span></div><button class="delete-product" type="button" data-delete-product="${product.id}">${currentLanguage !== "ru" ? "Delete" : "Удалить"}</button></div>`).join("");
  container.querySelectorAll<HTMLButtonElement>("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", () => {
      saveCatalogProducts(getCatalogProducts().filter((product) => product.id !== button.dataset.deleteProduct));
      renderCatalogProducts();
      renderAdminProducts();
      renderAdminOverview();
    });
  });
}

function orderStatusLabel(status: CheckoutOrder["status"]): string {
  const labels: Record<CheckoutOrder["status"], [string, string]> = {
    new: ["Новый", "New"], making: ["Создаётся", "Making"], shipped: ["Отправлен", "Shipped"], completed: ["Завершён", "Completed"], cancelled: ["Отменён", "Cancelled"]
  };
  return labels[status][currentLanguage !== "ru" ? 1 : 0];
}

function renderAdminOrders(): void {
  const container = document.getElementById("adminOrders");
  if (!container) return;
  const orders = getCheckoutOrders();
  container.innerHTML = orders.length ? orders.map((order) => `<article class="admin-order-item"><div class="admin-order-top"><div><strong>${safeText(order.number)}</strong><span>${new Date(order.createdAt).toLocaleString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")}</span></div><strong>€${order.total.toFixed(2)}</strong></div><p class="admin-order-products">${order.items.map((item) => `${safeText(item.name)} × ${item.quantity}`).join(", ")}</p><span>${safeText(order.customer.name)} · ${safeText(order.customer.city)} · ${safeText(order.customer.email)}</span><select class="order-status-select" data-order-number="${safeText(order.number)}">${(["new", "making", "shipped", "completed", "cancelled"] as CheckoutOrder["status"][]).map((status) => `<option value="${status}"${status === order.status ? " selected" : ""}>${orderStatusLabel(status)}</option>`).join("")}</select></article>`).join("") : `<div class="toy-empty"><p>${currentLanguage !== "ru" ? "No orders yet." : "Заказов пока нет."}</p></div>`;
  container.querySelectorAll<HTMLSelectElement>("[data-order-number]").forEach((select) => select.addEventListener("change", () => {
    const currentOrders = getCheckoutOrders();
    const order = currentOrders.find((item) => item.number === select.dataset.orderNumber);
    if (!order) return;
    order.status = select.value as CheckoutOrder["status"];
    saveCheckoutOrders(currentOrders);
    renderAdminOrders();
    renderAdminOverview();
  }));
}

function renderAdminOverview(): void {
  const products = getCatalogProducts();
  const orders = getCheckoutOrders();
  const passports = getNfcPassports();
  document.getElementById("adminMetricProducts")!.textContent = String(products.length + 1);
  document.getElementById("adminMetricOrders")!.textContent = String(orders.length);
  document.getElementById("adminMetricNewOrders")!.textContent = String(orders.filter((order) => order.status === "new").length);
  document.getElementById("adminMetricPassports")!.textContent = String(passports.length);
}

function generateNfcCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").toUpperCase();
  return `VIO-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

document.getElementById("nfcIssueForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = getSession();
  const account = session ? getAccounts()[session] : undefined;
  if (account?.role !== "admin") return;
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const passports = getNfcPassports();
  let code = generateNfcCode();
  while (passports.some((item) => item.code === code)) code = generateNfcCode();
  passports.unshift({ code, nameRu: String(data.get("nameRu")).trim(), nameEn: String(data.get("nameEn")).trim(), orderNumber: String(data.get("orderNumber")).trim(), issuedAt: new Date().toISOString(), ownerEmail: null, claimedAt: null });
  saveNfcPassports(passports);
  form.reset();
  const activationUrl = `${window.location.href.split("?")[0]}?nfc=${encodeURIComponent(code)}`;
  const status = document.getElementById("nfcIssueStatus");
  if (status) status.textContent = `${currentLanguage !== "ru" ? "Passport created" : "Паспорт создан"}: ${activationUrl}`;
  renderNfcPassports();
  renderAdminOverview();
});

function renderNfcPassports(): void {
  const container = document.getElementById("nfcPassports");
  if (!container) return;
  const passports = getNfcPassports();
  container.innerHTML = passports.length ? passports.map((passport) => `<article class="nfc-passport-item"><div><strong>${safeText(currentLanguage !== "ru" ? passport.nameEn : passport.nameRu)}</strong><span>${safeText(passport.code)}${passport.orderNumber ? ` · ${safeText(passport.orderNumber)}` : ""}</span><span>${passport.ownerEmail ? safeText(passport.ownerEmail) : (currentLanguage !== "ru" ? "Ready for activation" : "Готов к активации")}</span></div><b class="nfc-state${passport.ownerEmail ? " claimed" : ""}">${passport.ownerEmail ? (currentLanguage !== "ru" ? "Activated" : "Активирован") : (currentLanguage !== "ru" ? "New" : "Новый")}</b></article>`).join("") : `<div class="toy-empty"><p>${currentLanguage !== "ru" ? "No passports issued yet." : "Паспорта ещё не выпускались."}</p></div>`;
}

let activePassportCode: string | null = null;

function openPassport(code: string): void {
  const session = getSession();
  const account = session ? getAccounts()[session] : undefined;
  const toy = account?.toys.find((item) => item.code === code);
  if (!toy) return;
  activePassportCode = code;
  const name = currentLanguage !== "ru" ? (toy.nameEn || toy.name) : (toy.nameRu || toy.name);
  document.getElementById("passportName")!.textContent = name;
  document.getElementById("passportCode")!.textContent = toy.code;
  document.getElementById("passportBorn")!.textContent = new Date(toy.born).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU");
  renderPassportTimeline(toy);
  document.getElementById("passportModal")?.classList.add("open");
  document.getElementById("passportModal")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("shop-open");
}

function closePassport(): void {
  document.getElementById("passportModal")?.classList.remove("open");
  document.getElementById("passportModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("shop-open");
}

function renderPassportTimeline(toy: Toy): void {
  const born = new Date(toy.born).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU");
  const memories = toy.memories || [];
  document.getElementById("passportTimeline")!.innerHTML = `<article class="passport-event"><span>${born}</span><h3>${currentLanguage !== "ru" ? "The story begins" : "История начинается"}</h3><p>${currentLanguage !== "ru" ? "The day this character became part of your family." : "День, когда персонаж стал частью вашей семьи."}</p></article>${memories.map((memory) => `<article class="passport-event"><span>${new Date(memory.date).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")}</span><h3>${safeText(memory.title)}</h3><p>${safeText(memory.text)}</p></article>`).join("")}`;
}

document.querySelectorAll("[data-close-passport]").forEach((button) => button.addEventListener("click", closePassport));
document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-open-passport]");
  if (button?.dataset.openPassport) openPassport(button.dataset.openPassport);
});

document.getElementById("memoryForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = getSession();
  const accounts = getAccounts();
  const account = session ? accounts[session] : undefined;
  const toy = account?.toys.find((item) => item.code === activePassportCode);
  if (!account || !toy) return;
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  toy.memories ||= [];
  toy.memories.push({ id: crypto.randomUUID(), title: String(data.get("title")).trim(), text: String(data.get("text")).trim(), date: new Date().toISOString() });
  saveAccounts(accounts);
  form.reset();
  renderPassportTimeline(toy);
  renderDashboard(account);
});

function renderDashboard(account: Account): void {
  document.getElementById("profileName")!.textContent = account.name;
  document.getElementById("profileCardName")!.textContent = account.name;
  document.getElementById("profileEmail")!.textContent = account.email;
  document.querySelectorAll(".admin-only").forEach((element) => element.classList.toggle("hidden", account.role !== "admin"));
  document.querySelector(".account-panel")?.classList.toggle("admin-mode", account.role === "admin");
  if (account.role === "admin") {
    renderAdminProducts(); renderAdminOrders(); renderNfcPassports(); renderAdminOverview();
    if (!adminLayoutInitialized) { switchDashboardPage("admin-orders"); adminLayoutInitialized = true; }
  } else {
    const activePage = document.querySelector<HTMLButtonElement>(".dashboard-tab.active")?.dataset.dashboardTab;
    if (activePage?.startsWith("admin-")) switchDashboardPage("toys");
  }
  const toys = account.toys || [];
  document.getElementById("toyEmpty")?.classList.toggle("hidden", toys.length > 0);
  document.getElementById("toyList")!.innerHTML = toys.map((toy) => {
    const date = new Date(toy.born).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU");
    const name = currentLanguage !== "ru" ? (toy.nameEn || toy.name) : (toy.nameRu || toy.name);
    return `<article class="toy-life-card"><div class="toy-life-head"><div><p class="eyebrow">VIORI CHARACTER</p><h3>${safeText(name)}</h3></div><span class="toy-code">${safeText(toy.code)}</span></div><div class="life-timeline"><div class="life-event"><strong>${currentLanguage !== "ru" ? "The story begins" : "История начинается"}</strong>${currentLanguage !== "ru" ? `Joined your family on ${date}` : `Стала частью вашей семьи ${date}`}</div><div class="life-event"><strong>${currentLanguage !== "ru" ? "Saved chapters" : "Сохранённые главы"}</strong>${toy.memories?.length || 0}</div></div><button class="card-button open-passport" type="button" data-open-passport="${safeText(toy.code)}">${currentLanguage !== "ru" ? "Open passport" : "Открыть паспорт"}</button></article>`;
  }).join("");
  const shopOrders = getCheckoutOrders().filter((order) => order.customer.email.toLowerCase() === account.email.toLowerCase());
  const legacyOrders = account.orders || [];
  document.getElementById("ordersList")!.innerHTML = shopOrders.length ? shopOrders.map((order) => `<article class="order-item"><strong>${safeText(order.number)} · €${order.total.toFixed(2)}</strong><span>${order.items.map((item) => `${safeText(item.name)} × ${item.quantity}`).join(", ")}</span><span>${new Date(order.createdAt).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")} · ${orderStatusLabel(order.status)}</span></article>`).join("") : legacyOrders.length ? legacyOrders.map((order) => `<article class="order-item"><strong>${safeText(order.product)}</strong><span>${new Date(order.date).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")}</span></article>`).join("") : `<div class="toy-empty"><h3>${currentLanguage !== "ru" ? "No orders yet" : "Заказов пока нет"}</h3><p>${currentLanguage !== "ru" ? "Your future characters will appear here." : "Здесь появятся ваши будущие персонажи."}</p></div>`;
}

function renderAccount() {
  const accounts = getAccounts();
  const session = getSession();
  let account = session ? accounts[session] : undefined;
  if (account && !Object.values(accounts).some((item) => item.role === "admin")) {
    account.role = "admin";
    saveAccounts(accounts);
  }
  const nfcFromUrl = new URLSearchParams(window.location.search).get("nfc");
  if (account && nfcFromUrl) {
    const result = claimNfcPassport(nfcFromUrl, account.email);
    account = session ? getAccounts()[session] : undefined;
    setTimeout(() => {
      const status = document.getElementById("nfcStatus");
      if (status) status.textContent = result === "claimed" ? (currentLanguage !== "ru" ? "The passport is activated." : "Паспорт активирован.") : result === "taken" ? (currentLanguage !== "ru" ? "This passport belongs to another owner." : "Этот паспорт принадлежит другому владельцу.") : result === "invalid" ? (currentLanguage !== "ru" ? "Passport not found." : "Паспорт не найден.") : "";
    }, 0);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("nfc");
    history.replaceState({}, "", cleanUrl);
  }
  authView?.classList.toggle("hidden", Boolean(account));
  dashboardView?.classList.toggle("hidden", !account);
  if (!account) document.querySelector(".account-panel")?.classList.remove("admin-mode");
  if (account) renderDashboard(account);
}
} // end offline-only demo

function getSession(): string | null { return productionProfile?.id || null; }
function renderAccount(): void { if (supabase) void loadProductionAccount(); }
function openAccount(): void { if (supabase) productionOpenAccount(); }

function getProductionCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("viori-cart") || "[]") as CartItem[]; } catch { return []; }
}

// Корзина живёт в localStorage, то есть привязана к браузеру, а не к аккаунту.
// Рядом храним владельца: id пользователя либо "anon" для гостя. Без этого
// выбранные товары доставались следующему, кто войдёт на этом же устройстве.
//
// Одноразовая чистка: корзины, набранные до появления пометки владельца, могли
// быть присвоены чужому аккаунту, поэтому при первом запуске стираем их.
if (localStorage.getItem("viori-cart-owner-fix") !== "1") {
  localStorage.removeItem("viori-cart");
  localStorage.removeItem("viori-cart-owner");
  localStorage.setItem("viori-cart-owner-fix", "1");
}

function syncCartOwner(userId: string | null): void {
  const previous = localStorage.getItem("viori-cart-owner");

  if (!userId) {
    // Гость на странице. Чистим только если корзину оставил вошедший человек,
    // иначе потеряли бы корзину обычного посетителя на каждой перезагрузке.
    if (previous && previous !== "anon") {
      localStorage.removeItem("viori-cart");
      localStorage.setItem("viori-cart-owner", "anon");
    }
    return;
  }

  // Гостевую корзину при входе оставляем: её набрал тот же человек.
  if (previous && previous !== "anon" && previous !== userId) {
    localStorage.removeItem("viori-cart");
  }
  localStorage.setItem("viori-cart-owner", userId);
}

function saveProductionCart(cart: CartItem[]): void {
  localStorage.setItem("viori-cart", JSON.stringify(cart));
  localStorage.setItem("viori-cart-owner", productionProfile?.id || "anon");
  renderCart();
}

// Каталог нужен корзине любому посетителю, а не только администратору:
// loadProductionAdmin() выходит по роли, поэтому без этой загрузки
// productionProducts оставался пустым и корзина всегда рисовалась пустой.
let publicProductsLoaded = false;

async function ensureProductsLoaded(): Promise<void> {
  if (!supabase || publicProductsLoaded || productionProducts.length) return;
  publicProductsLoaded = true;
  const { data } = await supabase
    .from("products")
    .select("id,slug,name_ru,name_en,description_ru,description_en,category,price_cents,is_active,product_images(storage_path)")
    .eq("is_active", true);
  if (data?.length) {
    productionProducts = data as DbProduct[];
    renderCart();
  }
}

function renderCart(): void {
  if (!supabase) return;
  const cart = getProductionCart().filter((item) => productionProducts.some((product) => product.id === item.id));
  const items = cart.map((item) => ({ item, product: productionProducts.find((product) => product.id === item.id)! }));
  document.getElementById("cartCount")!.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  document.getElementById("cartTotal")!.textContent = `€${items.reduce((sum, row) => sum + row.product.price_cents * row.item.quantity, 0) / 100}`;
  const container = document.getElementById("cartItems");
  if (container) container.innerHTML = items.length ? items.map(({ item, product }) => `<article class="cart-item"><div><strong>${safeText(currentLanguage !== "ru" ? product.name_en : product.name_ru)}</strong><span>€${(product.price_cents / 100).toFixed(2)}</span></div><div class="cart-quantity"><button type="button" data-cart-change="-1" data-cart-id="${product.id}">−</button><span>${item.quantity}</span><button type="button" data-cart-change="1" data-cart-id="${product.id}">+</button></div></article>`).join("") : `<div class="toy-empty"><p>${currentLanguage !== "ru" ? "Your bag is empty." : "Корзина пока пуста."}</p></div>`;
  const checkout = document.getElementById("cartCheckout") as HTMLButtonElement | null;
  if (checkout) checkout.disabled = !items.length;
}

function openProductionCart(): void {
  void ensureProductsLoaded();
  renderCart(); document.getElementById("cartDrawer")?.classList.add("open"); document.getElementById("cartDrawer")?.setAttribute("aria-hidden", "false"); document.body.classList.add("shop-open");
}

function closeProductionCart(): void {
  document.getElementById("cartDrawer")?.classList.remove("open"); document.getElementById("cartDrawer")?.setAttribute("aria-hidden", "true"); document.body.classList.remove("shop-open");
}

function productionCheckoutTotal(): number {
  const subtotal = getProductionCart().reduce((sum, item) => sum + (productionProducts.find((p) => p.id === item.id)?.price_cents || 0) * item.quantity, 0);
  const delivery = document.querySelector<HTMLInputElement>('#checkoutForm input[name="delivery"]:checked')?.value === "pickup" ? 0 : 695;
  return subtotal + delivery;
}

async function openProductionCheckout(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { closeProductionCart(); productionOpenAccount(); if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Sign in before checkout." : "Войдите в аккаунт перед оформлением заказа."; return; }
  closeProductionCart();
  const form = document.getElementById("checkoutForm") as HTMLFormElement;
  (form.elements.namedItem("email") as HTMLInputElement).value = user.email || "";
  (form.elements.namedItem("email") as HTMLInputElement).readOnly = true;
  (form.elements.namedItem("name") as HTMLInputElement).value ||= productionProfile?.display_name || "";
  document.getElementById("checkoutTotal")!.textContent = `€${(productionCheckoutTotal() / 100).toFixed(2)}`;
  document.getElementById("checkoutFormView")?.classList.remove("hidden"); document.getElementById("checkoutSuccess")?.classList.add("hidden");
  document.getElementById("checkoutModal")?.classList.add("open"); document.getElementById("checkoutModal")?.setAttribute("aria-hidden", "false");
}

async function renderCatalogProducts(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from("products").select("id,slug,name_ru,name_en,description_ru,description_en,category,price_cents,is_active,product_images(storage_path)").eq("is_active", true).order("created_at");
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid || error) return;
  productionProducts = (data || []) as DbProduct[];
  if (!productionProducts.length) {
    grid.innerHTML = `<div class="toy-empty"><h3>${currentLanguage !== "ru" ? "The collection is being prepared" : "Коллекция готовится"}</h3><p>${currentLanguage !== "ru" ? "Products will appear after safety documentation is complete." : "Товары появятся после завершения документов по безопасности."}</p></div>`;
    return;
  }
  grid.innerHTML = productionProducts.map((product) => {
    const name = currentLanguage !== "ru" ? product.name_en : product.name_ru;
    const description = currentLanguage !== "ru" ? product.description_en : product.description_ru;
    const path = product.product_images?.[0]?.storage_path;
    const imageUrl = path ? supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl : "";
    return `<article class="product-card visible" data-category="${safeText(product.category)}"><div class="product-image"${imageUrl ? ` style="background-image:url('${safeText(imageUrl)}');background-size:cover;background-position:center"` : ""}></div><div class="product-info"><h3>${safeText(name)}</h3><p class="price">€${(product.price_cents / 100).toFixed(2)}</p></div><p class="product-description">${safeText(description)}</p><div class="card-actions"><button class="card-button" type="button" data-db-add-cart="${product.id}">${currentLanguage !== "ru" ? "Add to bag" : "В корзину"}</button></div></article>`;
  }).join("");
  renderCart();
}

type DbProfile = { id: string; display_name: string; role: "customer" | "admin" };
type DbPassport = { id: string; public_code: string; character_name_ru: string; character_name_en: string; status: string; claimed_at: string | null; issued_at: string; story?: Record<string, string> | null; photo_path?: string | null; owner_name?: string | null; order_id?: string | null; owner_id?: string | null; orders?: { order_number: string } | { order_number: string }[] | null };

// Вложенную связь Supabase отдаёт то объектом, то массивом — зависит от того,
// как выведена связь. Приводим к одному виду.
function passportOrderNumber(passport: DbPassport): string {
  const linked = passport.orders;
  if (!linked) return "";
  return (Array.isArray(linked) ? linked[0]?.order_number : linked.order_number) || "";
}

// Короткие подписи, которые рисует код, а не разметка: словарь переводов
// до них не достаёт, поэтому язык выбираем здесь.
function label(ru: string, uk: string, en: string): string {
  if (currentLanguage === "ru") return ru;
  if (currentLanguage === "uk") return uk;
  return en;
}

// Имя даёт владелец; имя от мастера — только рабочая пометка в админке.
function passportDisplayName(passport: DbPassport): string {
  const fallback = currentLanguage === "ru" ? passport.character_name_ru : passport.character_name_en;
  return passport.owner_name
    || fallback
    || passport.character_name_ru
    || passport.character_name_en
    || (currentLanguage !== "ru" ? "VIORI character" : "Персонаж VIORI");
}
type DbOrderItem = { product_name: string; unit_price_cents: number; quantity: number };
type DbShippingAddress = { street?: string; postcode?: string; city?: string; country?: string };
type DbOrder = {
  id: string; order_number: string; total_cents: number; status: string; created_at: string;
  customer_name?: string; customer_phone?: string; customer_email?: string;
  shipping_address?: DbShippingAddress | null; delivery_method?: string; delivery_cents?: number;
  order_items?: DbOrderItem[];
};
type DbProduct = { id: string; slug: string; name_ru: string; name_en: string; description_ru: string; description_en: string; category: CatalogProduct["category"]; price_cents: number; is_active: boolean; product_images?: Array<{ storage_path: string }> };
type DbCustomRequest = { id: string; created_at: string; customer_name: string; contact_email: string; product: string; message: string; status: string };

let productionProfile: DbProfile | null = null;
let productionPassports: DbPassport[] = [];
let productionOrders: DbOrder[] = [];
let productionProducts: DbProduct[] = [];
let productionRequests: DbCustomRequest[] = [];
let activePassportId: string | null = null;

function productionMessage(error: unknown): string {
  const raw = error as { message?: string; details?: string; hint?: string; code?: string } | null;
  const message = error instanceof Error ? error.message : String(raw?.message || error || "");
  // Настоящая причина иначе теряется: наружу уходит одна общая фраза.
  if (error) console.error("VIORI backend error:", error);

  if (message.includes("Invalid login credentials")) return currentLanguage !== "ru" ? "Incorrect email or password." : "Неверный email или пароль.";
  if (message.includes("Email not confirmed")) return currentLanguage !== "ru" ? "Confirm your email first." : "Сначала подтвердите email.";
  if (message.includes("User already registered")) return currentLanguage !== "ru" ? "This email is already registered." : "Этот email уже зарегистрирован.";

  // Ошибки, которые create_order поднимает сам.
  if (message.includes("authentication_required")) return currentLanguage !== "ru" ? "Please sign in to place an order." : "Войдите в аккаунт, чтобы оформить заказ.";
  if (message.includes("empty_cart")) return currentLanguage !== "ru" ? "Your cart is empty." : "Корзина пуста.";
  if (message.includes("invalid_cart")) return currentLanguage !== "ru" ? "Some items are no longer available. Please refresh the cart." : "Товара больше нет в каталоге. Обновите корзину.";
  if (message.includes("invalid_customer_details")) return currentLanguage !== "ru" ? "Check your name and phone number." : "Проверьте имя и номер телефона.";
  if (message.includes("invalid_delivery_method")) return currentLanguage !== "ru" ? "Choose a delivery method." : "Выберите способ доставки.";

  return currentLanguage !== "ru" ? "Something went wrong. Please try again." : "Произошла ошибка. Попробуйте ещё раз.";
}

function productionOpenAccount(): void {
  document.getElementById("accountModal")?.classList.add("open");
  document.getElementById("accountModal")?.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-open");
}

function showProductionAuthForm(formId: "loginForm" | "registerForm" | "forgotPasswordForm" | "resetPasswordForm"): void {
  ["loginForm", "registerForm", "forgotPasswordForm", "resetPasswordForm"].forEach((id) => document.getElementById(id)?.classList.toggle("hidden", id !== formId));
  document.getElementById("registrationSuccess")?.classList.add("hidden");
  document.querySelector(".auth-tabs")?.classList.toggle("hidden", formId === "forgotPasswordForm" || formId === "resetPasswordForm");
}

function productionCloseAccount(): void {
  document.getElementById("accountModal")?.classList.remove("open");
  document.getElementById("accountModal")?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-open");
}

function switchProductionDashboardPage(pageName: string): void {
  document.querySelectorAll<HTMLButtonElement>(".dashboard-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.dashboardTab === pageName);
  });
  document.querySelectorAll<HTMLElement>(".dashboard-page").forEach((page) => {
    page.classList.toggle("hidden", page.dataset.dashboardPage !== pageName);
  });
}

async function loadProductionAccount(): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    productionProfile = null; productionPassports = []; productionOrders = [];
    syncCartOwner(null);
    renderCart();
    authView?.classList.remove("hidden"); dashboardView?.classList.add("hidden");
    document.querySelector(".account-panel")?.classList.remove("admin-mode");
    document.body.classList.remove("viori-admin");
    localStorage.removeItem("viori-role");
    return;
  }
  syncCartOwner(user.id);
  renderCart();
  const [{ data: profile, error: profileError }, { data: passports }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("id,display_name,role").eq("id", user.id).single(),
    supabase.from("nfc_passports").select("id,public_code,character_name_ru,character_name_en,status,claimed_at,issued_at,story,photo_path,owner_name,owner_id,order_id,orders(order_number)").order("issued_at", { ascending: false }),
    supabase.from("orders").select("id,order_number,total_cents,status,created_at,customer_name,customer_phone,customer_email,shipping_address,delivery_method,delivery_cents,order_items(product_name,unit_price_cents,quantity)").order("created_at", { ascending: false })
  ]);
  if (profileError) throw profileError;
  productionProfile = profile as DbProfile;
  const googleName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
  if (productionProfile && !productionProfile.display_name && googleName) {
    const { error: nameError } = await supabase.from("profiles").update({ display_name: googleName }).eq("id", user.id);
    if (!nameError) productionProfile.display_name = googleName;
  }
  productionPassports = (passports || []) as DbPassport[];
  productionOrders = (orders || []) as DbOrder[];
  authView?.classList.add("hidden"); dashboardView?.classList.remove("hidden");
  renderProductionDashboard(user.email || "");
  const token = new URLSearchParams(location.search).get("nfc");
  if (token) await claimProductionPassport(token);
  const transferToken = new URLSearchParams(location.search).get("transfer");
  if (transferToken) {
    const { error } = await supabase.rpc("accept_passport_transfer", { transfer_token: transferToken });
    const clean = new URL(location.href); clean.searchParams.delete("transfer"); history.replaceState({}, "", clean);
    if (accountStatus) accountStatus.textContent = error ? (currentLanguage !== "ru" ? "Transfer link is invalid or expired." : "Ссылка передачи недействительна или устарела.") : (currentLanguage !== "ru" ? "The toy is now in your account." : "Игрушка передана в ваш кабинет.");
    if (!error) { productionOpenAccount(); await loadProductionAccount(); }
  }
}

function renderProductionDashboard(email: string): void {
  if (!productionProfile) return;
  const isAdmin = productionProfile.role === "admin";
  document.getElementById("profileName")!.textContent = productionProfile.display_name || email;
  document.getElementById("profileCardName")!.textContent = productionProfile.display_name || "—";
  document.getElementById("profileEmail")!.textContent = email;
  document.querySelectorAll(".admin-only").forEach((el) => el.classList.toggle("hidden", !isAdmin));
  document.querySelector(".account-panel")?.classList.toggle("admin-mode", isAdmin);
  // Корзина администратору не нужна. Метка в localStorage — чтобы подстраницы,
  // которые не грузят этот бандл, тоже знали роль. Это только внешний вид:
  // доступ к данным по-прежнему решают политики RLS.
  document.body.classList.toggle("viori-admin", isAdmin);
  localStorage.setItem("viori-role", isAdmin ? "admin" : "customer");
  const selectedPage = document.querySelector<HTMLButtonElement>(".dashboard-tab.active:not(.hidden)")?.dataset.dashboardTab;
  const allowedPage = isAdmin
    ? (selectedPage?.startsWith("admin-") ? selectedPage : "admin-orders")
    : (selectedPage && !selectedPage.startsWith("admin-") ? selectedPage : "toys");
  switchProductionDashboardPage(allowedPage);
  document.getElementById("toyEmpty")?.classList.toggle("hidden", productionPassports.length > 0);
  document.getElementById("toyList")!.innerHTML = productionPassports.map((passport) => {
    const name = passportDisplayName(passport);
    // Паспорт, выпущенный для заказа этого человека, виден ему сразу, но до
    // ввода кода с карточки владельца у него нет — историю открывать нечего.
    const mine = passport.owner_id === productionProfile?.id;
    const head = `<div class="toy-life-head"><div><p class="eyebrow">VIORI CHARACTER</p><h3>${safeText(name)}</h3></div><span class="toy-code">${safeText(passport.public_code)}</span></div>`;
    if (mine) {
      return `<article class="toy-life-card">${head}<button class="card-button" type="button" data-production-passport="${passport.id}">${label("Открыть паспорт", "Відкрити паспорт", "Open passport")}</button></article>`;
    }
    return `<article class="toy-life-card pending">${head}`
      + `<p class="toy-pending">${label(
          "Паспорт готов. Активируйте его кодом с карточки в коробке — и история откроется.",
          "Паспорт готовий. Активуйте його кодом із картки в коробці — і історія відкриється.",
          "The passport is ready. Activate it with the code from the card in the box to open the story."
        )}</p></article>`;
  }).join("");
  document.getElementById("ordersList")!.innerHTML = productionOrders.length ? productionOrders.map((order) => `<article class="order-item"><strong>${safeText(order.order_number)} · €${(order.total_cents / 100).toFixed(2)}</strong><span>${new Date(order.created_at).toLocaleDateString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")} · ${dbOrderStatusLabel(order.status)}</span></article>`).join("") : `<div class="toy-empty"><h3>${currentLanguage !== "ru" ? "No orders yet" : "Заказов пока нет"}</h3></div>`;
  if (isAdmin) void loadProductionAdmin();
}

async function claimProductionPassport(token: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc("claim_nfc_passport", { claim_token: token.trim() });
  const message = error
    ? label("Код недействителен или паспорт уже активирован.", "Код недійсний або паспорт уже активовано.", "Invalid or already activated passport.")
    : label("Паспорт активирован. Игрушка теперь ваша.", "Паспорт активовано. Іграшка тепер ваша.", "Passport activated. The toy is yours now.");
  // Результат раньше уходил только в «Мои игрушки», где его можно было
  // не заметить. Показываем и там, и в шапке кабинета.
  const status = document.getElementById("nfcStatus");
  if (status) status.textContent = message;
  if (accountStatus) accountStatus.textContent = message;
  // Читаем до очистки адреса: сюда человек вернётся после активации.
  const back = new URLSearchParams(location.search).get("back") || "";
  const clean = new URL(location.href);
  clean.searchParams.delete("nfc");
  clean.searchParams.delete("back");
  history.replaceState({}, "", clean);
  if (!error) {
    // Игрушка уже сохранена в кабинете, поэтому показываем сразу историю —
    // ради неё человек и подносил телефон.
    if (back) {
      location.href = `passport.html?code=${encodeURIComponent(back)}&claimed=1`;
      return;
    }
    switchProductionDashboardPage("toys");
    await loadProductionAccount();
  }
}

async function openProductionPassport(id: string): Promise<void> {
  if (!supabase) return;
  const passport = productionPassports.find((item) => item.id === id);
  if (!passport) return;
  activePassportId = id;
  document.getElementById("passportName")!.textContent = passportDisplayName(passport);
  document.getElementById("passportCode")!.textContent = passport.public_code;
  // Поле имени подставляем уже данное, чтобы владелец мог его исправить.
  const nameInput = document.querySelector<HTMLInputElement>('#passportNameForm input[name="name"]');
  if (nameInput) nameInput.value = passport.owner_name || "";
  document.getElementById("passportBorn")!.textContent = new Date(passport.claimed_at || passport.issued_at).toLocaleDateString();
  const { data } = await supabase.from("toy_memories").select("id,title,body,happened_at").eq("passport_id", id).order("happened_at");
  document.getElementById("passportTimeline")!.innerHTML = (data || []).map((memory) => `<article class="passport-event"><span>${safeText(memory.happened_at)}</span><h3>${safeText(memory.title)}</h3><p>${safeText(memory.body)}</p></article>`).join("") || `<article class="passport-event"><h3>${currentLanguage !== "ru" ? "The story begins" : "История начинается"}</h3></article>`;
  document.getElementById("passportModal")?.classList.add("open");
  document.getElementById("passportModal")?.setAttribute("aria-hidden", "false");
}

async function loadProductionAdmin(): Promise<void> {
  if (!supabase || productionProfile?.role !== "admin") return;
  const [{ data: products }, passportResult, { data: requests }] = await Promise.all([
    supabase.from("products").select("id,slug,name_ru,name_en,description_ru,description_en,category,price_cents,is_active,product_images(storage_path)").order("created_at", { ascending: false }),
    supabase.from("nfc_passports").select("id,public_code,character_name_ru,character_name_en,status,claimed_at,issued_at,story,photo_path,owner_name,owner_id,order_id,orders(order_number)").order("issued_at", { ascending: false }),
    supabase.from("custom_requests").select("id,created_at,customer_name,contact_email,product,message,status").order("created_at", { ascending: false })
  ]);
  productionProducts = (products || []) as DbProduct[];

  // Если очередная миграция ещё не применена, запрос падает на отсутствующей
  // колонке и список паспортов пропадал целиком. Показываем то, что есть,
  // и говорим, чего не хватает, вместо пустого экрана.
  let passports: DbPassport[] | null = passportResult.data as DbPassport[] | null;
  if (passportResult.error) {
    const fallback = await supabase
      .from("nfc_passports")
      .select("id,public_code,character_name_ru,character_name_en,status,claimed_at,issued_at")
      .order("issued_at", { ascending: false });
    passports = fallback.data as DbPassport[] | null;
    const status = document.getElementById("nfcIssueStatus");
    if (status && !fallback.error) {
      status.textContent = label(
        `База ещё не обновлена: ${passportResult.error.message}. Выполните последнюю миграцию.`,
        `Базу ще не оновлено: ${passportResult.error.message}. Виконайте останню міграцію.`,
        `The database is out of date: ${passportResult.error.message}. Apply the latest migration.`
      );
    }
  }
  productionPassports = (passports || []) as DbPassport[];
  productionRequests = (requests || []) as DbCustomRequest[];
  renderProductionRequests();
  renderProductionAdmin();
}

// Статусы приходят из базы как есть (new, paid, ...) и раньше показывались
// без перевода — в интерфейсе на любом языке оставались английские слова.
const dbStatusLabels: Record<string, Record<Language, string>> = {
  new: { ru: "Новый", uk: "Нове", en: "New", nl: "Nieuw", de: "Neu", fr: "Nouvelle" },
  paid: { ru: "Оплачен", uk: "Оплачено", en: "Paid", nl: "Betaald", de: "Bezahlt", fr: "Payée" },
  making: { ru: "Создаётся", uk: "Створюється", en: "Making", nl: "In de maak", de: "In Arbeit", fr: "En création" },
  shipped: { ru: "Отправлен", uk: "Відправлено", en: "Shipped", nl: "Verzonden", de: "Versandt", fr: "Expédiée" },
  completed: { ru: "Завершён", uk: "Завершено", en: "Completed", nl: "Afgerond", de: "Abgeschlossen", fr: "Terminée" },
  cancelled: { ru: "Отменён", uk: "Скасовано", en: "Cancelled", nl: "Geannuleerd", de: "Storniert", fr: "Annulée" }
};

function dbOrderStatusLabel(status: string): string {
  return dbStatusLabels[status]?.[currentLanguage] || safeText(status);
}

// После сохранения список паспортов перерисовывается целиком, и раскрытый
// редактор сказки схлопывался вместе с только что введённым текстом —
// выглядело так, будто ничего не сохранилось. Запоминаем, что было открыто.
let openStoryPassportId = "";
let storySavedMessage = "";

const requestStatusLabels: Record<string, Record<Language, string>> = {
  new: { ru: "Новая", uk: "Нова", en: "New", nl: "Nieuw", de: "Neu", fr: "Nouvelle" },
  in_progress: { ru: "В работе", uk: "В роботі", en: "In progress", nl: "In behandeling", de: "In Bearbeitung", fr: "En cours" },
  done: { ru: "Закрыта", uk: "Закрита", en: "Done", nl: "Afgerond", de: "Erledigt", fr: "Terminée" }
};

function renderProductionRequests(): void {
  const container = document.getElementById("adminRequests");
  if (!container) return;
  const ru = currentLanguage === "ru";
  if (!productionRequests.length) {
    container.innerHTML = `<div class="toy-empty"><p>${ru ? "Заявок пока нет." : "No requests yet."}</p></div>`;
    return;
  }
  container.innerHTML = productionRequests.map((request) => {
    const options = Object.keys(requestStatusLabels).map((status) =>
      `<option value="${status}"${status === request.status ? " selected" : ""}>${requestStatusLabels[status][currentLanguage]}</option>`
    ).join("");
    return `<article class="admin-request${request.status === "new" ? " unread" : ""}">`
      + `<div class="admin-request-top"><div><strong>${safeText(request.customer_name)}</strong>`
      + `<span>${new Date(request.created_at).toLocaleString(ru ? "ru-RU" : "en-GB")} · ${safeText(request.product)}</span></div>`
      + `<select class="order-status-select" data-request="${request.id}">${options}</select></div>`
      + `<p class="admin-request-message">${safeText(request.message)}</p>`
      + `<a class="admin-request-reply" href="mailto:${safeText(request.contact_email)}?subject=${encodeURIComponent("VIORI — " + request.product)}">${safeText(request.contact_email)}</a>`
      + `</article>`;
  }).join("");
}

// Карточка заказа показывала только номер и сумму — по ней нельзя было понять,
// что именно заказал клиент и куда это везти.
function orderDetailsHtml(order: DbOrder): string {
  const ru = currentLanguage === "ru";
  const items = (order.order_items || [])
    .map((item) => `<li><span>${safeText(item.product_name)} × ${item.quantity}</span><b>€${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}</b></li>`)
    .join("");
  const address = order.shipping_address || {};
  const addressLine = [address.street, address.postcode, address.city, address.country]
    .filter(Boolean).map((part) => safeText(String(part))).join(", ");
  const delivery = order.delivery_method === "pickup"
    ? (ru ? "Самовывоз" : "Pickup")
    : (ru ? "Стандартная доставка" : "Standard delivery");
  const row = (label: string, value: string) => `<div><dt>${label}</dt><dd>${value || "—"}</dd></div>`;
  return `<details class="admin-order-details"><summary>${ru ? "Что в заказе" : "Order details"}</summary><div class="admin-order-body">`
    + `<ul class="admin-order-items">${items || `<li><span>${ru ? "Позиции не найдены" : "No items"}</span></li>`}</ul>`
    + `<dl class="admin-order-meta">`
    + row(ru ? "Клиент" : "Customer", safeText(order.customer_name || ""))
    + row(ru ? "Телефон" : "Phone", safeText(order.customer_phone || ""))
    + row("Email", safeText(order.customer_email || ""))
    + row(ru ? "Доставка" : "Delivery", `${delivery} · €${((order.delivery_cents || 0) / 100).toFixed(2)}`)
    + row(ru ? "Адрес" : "Address", addressLine)
    // Видно ли, что для заказа уже выпущен паспорт — иначе легко выпустить второй.
    + row(
        label("NFC-паспорт", "NFC-паспорт", "NFC passport"),
        productionPassports.filter((passport) => passport.order_id === order.id)
          .map((passport) => safeText(passport.public_code)).join(", ")
          || label("не выпущен", "не випущено", "not issued")
      )
    + `</dl></div></details>`;
}

// Номер заказа вводили руками, поэтому опечатка либо срывала выпуск, либо
// привязывала паспорт не к тому заказу. Теперь выбираем из реальных заказов.
function renderNfcOrderOptions(): void {
  const select = document.getElementById("nfcOrderSelect") as HTMLSelectElement | null;
  if (!select) return;
  const previous = select.value;
  const linked = new Set(productionPassports.map((passport) => passport.order_id).filter(Boolean));
  const options = productionOrders.map((order) => {
    const date = new Date(order.created_at).toLocaleDateString(currentLanguage === "ru" ? "ru-RU" : "en-GB");
    const mark = linked.has(order.id) ? ` · ${label("паспорт уже выпущен", "паспорт уже випущено", "passport already issued")}` : "";
    return `<option value="${safeText(order.order_number)}">${safeText(order.order_number)} · ${safeText(order.customer_name || "")} · ${date}${mark}</option>`;
  }).join("");
  select.innerHTML = `<option value="">${label("Без привязки к заказу", "Без прив'язки до замовлення", "Not linked to an order")}</option>${options}`;
  select.value = previous;
}

function renderProductionAdmin(): void {
  renderNfcOrderOptions();
  const productContainer = document.getElementById("adminProducts");
  if (productContainer) productContainer.innerHTML = productionProducts.map((p) => `<div class="admin-product-item"><div><strong>${safeText(currentLanguage !== "ru" ? p.name_en : p.name_ru)}</strong><span>€${(p.price_cents / 100).toFixed(2)} · ${p.is_active ? (currentLanguage !== "ru" ? "PUBLISHED" : "ОПУБЛИКОВАНО") : (currentLanguage !== "ru" ? "DRAFT" : "ЧЕРНОВИК")}</span></div><div class="admin-product-actions"><button type="button" data-toggle-db-product="${p.id}" data-next-active="${String(!p.is_active)}">${p.is_active ? (currentLanguage !== "ru" ? "Hide" : "Скрыть из каталога") : (currentLanguage !== "ru" ? "Publish" : "Опубликовать в каталоге")}</button><button type="button" data-delete-db-product="${p.id}">${currentLanguage !== "ru" ? "Delete" : "Удалить"}</button></div></div>`).join("");
  const passportContainer = document.getElementById("nfcPassports");
  if (passportContainer) passportContainer.innerHTML = productionPassports.map((p) => {
    const ru = currentLanguage === "ru";
    const photo = p.photo_path ? supabase!.storage.from("product-images").getPublicUrl(p.photo_path).data.publicUrl : "";
    return `<article class="nfc-passport-item"><div class="nfc-passport-head"><div><strong>${safeText(passportDisplayName(p))}</strong><span>${safeText(p.public_code)}</span></div>`
      + `<div class="nfc-passport-actions">${passportOrderNumber(p) ? `<span class="nfc-order">${safeText(passportOrderNumber(p))}</span>` : ""}<b class="nfc-state${p.status === "claimed" ? " claimed" : ""}">${safeText(p.status)}</b>`
      + `<button type="button" class="nfc-delete" data-delete-passport="${p.id}" data-passport-code="${safeText(p.public_code)}">${label("Удалить", "Видалити", "Delete")}</button></div></div>`
      + `<details class="passport-story-editor"${openStoryPassportId === p.id ? " open" : ""}><summary>${label("Сказка и фотография", "Казка і фотографія", "Story and photo")}</summary>`
      + `<form class="account-form passport-story-form" data-passport-story="${p.id}">`
      + (photo ? `<img class="passport-story-photo" src="${photo}" alt="">` : "")
      + `<div class="story-langs" role="tablist">${(["ru", "uk", "en", "nl", "de", "fr"] as Language[]).map((code, index) =>
          `<button class="story-lang${index === 0 ? " active" : ""}" type="button" data-story-lang="${code}">${code.toUpperCase()}</button>`).join("")}</div>`
      + (["ru", "uk", "en", "nl", "de", "fr"] as Language[]).map((code, index) =>
          `<label class="story-lang-field${index === 0 ? " active" : ""}" data-story-field="${code}"><span>${label("Сказка", "Казка", "Story")} · ${code.toUpperCase()}</span>`
          + `<textarea name="story_${code}" rows="6" placeholder="${ru ? "Она родилась тихим утром…" : "She was born on a quiet morning…"}">${safeText(p.story?.[code] || "")}</textarea></label>`).join("")
      + `<label class="image-upload"><span>${label("Фотография персонажа", "Фотографія персонажа", "Character photo")}</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"><small>${label("JPG, PNG или WebP. Необязательно — можно оставить прежнюю.", "JPG, PNG або WebP. Необов'язково — можна лишити попередню.", "JPG, PNG or WebP. Optional — the current one stays.")}</small></label>`
      + `<button class="button" type="submit">${label("Сохранить", "Зберегти", "Save")}</button>`
      + `<p class="account-status" data-story-status="${p.id}" aria-live="polite">${openStoryPassportId === p.id ? safeText(storySavedMessage) : ""}</p>`
      + `</form></details></article>`;
  }).join("");
  const orderContainer = document.getElementById("adminOrders");
  if (orderContainer) orderContainer.innerHTML = productionOrders.length ? productionOrders.map((order) => `<article class="admin-order-item"><div class="admin-order-top"><div><strong>${safeText(order.order_number)}</strong><span>${new Date(order.created_at).toLocaleString(currentLanguage !== "ru" ? "en-GB" : "ru-RU")}</span></div><strong>€${(order.total_cents / 100).toFixed(2)}</strong></div><select class="order-status-select" data-db-order="${order.id}">${["new", "paid", "making", "shipped", "completed", "cancelled"].map((status) => `<option value="${status}"${status === order.status ? " selected" : ""}>${dbOrderStatusLabel(status)}</option>`).join("")}</select>${orderDetailsHtml(order)}</article>`).join("") : `<div class="toy-empty"><p>${currentLanguage !== "ru" ? "No orders yet." : "Заказов пока нет."}</p></div>`;
  document.getElementById("adminMetricProducts")!.textContent = String(productionProducts.length);
  document.getElementById("adminMetricOrders")!.textContent = String(productionOrders.length);
  document.getElementById("adminMetricNewOrders")!.textContent = String(productionOrders.filter((o) => o.status === "new").length);
  document.getElementById("adminMetricPassports")!.textContent = String(productionPassports.length);
}

if (supabase) {
  document.documentElement.dataset.appVersion = "2026-08-02-2";
  // Счётчик в шапке должен быть верным сразу, до открытия корзины.
  void ensureProductsLoaded();
  document.getElementById("openAccount")?.addEventListener("click", productionOpenAccount);
  document.getElementById("openCart")?.addEventListener("click", openProductionCart);
  document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeProductionCart));
  document.querySelectorAll("[data-close-checkout]").forEach((button) => button.addEventListener("click", () => { document.getElementById("checkoutModal")?.classList.remove("open"); document.getElementById("checkoutModal")?.setAttribute("aria-hidden", "true"); }));
  document.getElementById("cartCheckout")?.addEventListener("click", () => void openProductionCheckout());
  document.querySelectorAll<HTMLInputElement>('#checkoutForm input[name="delivery"]').forEach((input) => input.addEventListener("change", () => { document.getElementById("checkoutTotal")!.textContent = `€${(productionCheckoutTotal() / 100).toFixed(2)}`; }));
  document.addEventListener("click", (event) => {
    const add = (event.target as HTMLElement).closest<HTMLElement>("[data-db-add-cart]");
    if (add?.dataset.dbAddCart) { const cart = getProductionCart(); const existing = cart.find((item) => item.id === add.dataset.dbAddCart); if (existing) existing.quantity = Math.min(20, existing.quantity + 1); else cart.push({ id: add.dataset.dbAddCart, quantity: 1 }); saveProductionCart(cart); openProductionCart(); return; }
    const change = (event.target as HTMLElement).closest<HTMLElement>("[data-cart-change]");
    if (change?.dataset.cartId) { const cart = getProductionCart(); const item = cart.find((entry) => entry.id === change.dataset.cartId); if (!item) return; item.quantity += Number(change.dataset.cartChange); saveProductionCart(cart.filter((entry) => entry.quantity > 0)); }
  });
  document.getElementById("checkoutForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const status = document.getElementById("checkoutStatus");
    const cart = getProductionCart();
    const { data: result, error } = await supabase.rpc("create_order", {
      customer_name: String(data.get("name")).trim(), customer_phone: String(data.get("phone")).trim(),
      shipping_address: { street: String(data.get("address")).trim(), postcode: String(data.get("postcode")).trim().toUpperCase(), city: String(data.get("city")).trim(), country: "NL" },
      delivery_method: String(data.get("delivery")), cart_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity }))
    });
    if (error || !result?.[0]) { if (status) status.textContent = productionMessage(error); return; }
    saveProductionCart([]); document.getElementById("checkoutOrderNumber")!.textContent = result[0].order_number;
    document.getElementById("checkoutFormView")?.classList.add("hidden"); document.getElementById("checkoutSuccess")?.classList.remove("hidden");
    await loadProductionAccount();
  });
  document.getElementById("openCancellation")?.addEventListener("click", async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { productionOpenAccount(); if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Sign in to request a cancellation." : "Войдите, чтобы запросить отмену."; return; }
    const form = document.getElementById("cancellationForm") as HTMLFormElement;
    (form.elements.namedItem("email") as HTMLInputElement).value = user.email || "";
    (form.elements.namedItem("email") as HTMLInputElement).readOnly = true;
    document.getElementById("cancellationModal")?.classList.add("open"); document.getElementById("cancellationModal")?.setAttribute("aria-hidden", "false");
  });
  document.querySelectorAll("[data-close-cancellation]").forEach((button) => button.addEventListener("click", () => { document.getElementById("cancellationModal")?.classList.remove("open"); document.getElementById("cancellationModal")?.setAttribute("aria-hidden", "true"); }));
  document.getElementById("cancellationForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const status = document.getElementById("cancellationStatus");
    const { data: reference, error } = await supabase.rpc("request_order_cancellation", { target_order_number: String(data.get("orderNumber")).trim(), cancellation_reason: String(data.get("reason")).trim() });
    if (error || !reference) { if (status) status.textContent = currentLanguage !== "ru" ? "This order cannot be cancelled online." : "Этот заказ нельзя отменить онлайн."; return; }
    document.getElementById("cancellationReference")!.textContent = `${currentLanguage !== "ru" ? "Reference" : "Номер обращения"}: ${String(reference).slice(0, 8).toUpperCase()}`;
    document.getElementById("cancellationFormView")?.classList.add("hidden"); document.getElementById("cancellationSuccess")?.classList.remove("hidden");
  });
  document.querySelectorAll("[data-close-account]").forEach((button) => button.addEventListener("click", productionCloseAccount));
  document.querySelectorAll<HTMLButtonElement>(".dashboard-tab").forEach((tab) => tab.addEventListener("click", () => {
    if (tab.classList.contains("hidden")) return;
    switchProductionDashboardPage(tab.dataset.dashboardTab || "toys");
  }));
  document.querySelector(".dashboard-tabs")?.addEventListener("click", (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-dashboard-tab]");
    if (!tab || tab.classList.contains("hidden")) return;
    event.preventDefault();
    switchProductionDashboardPage(tab.dataset.dashboardTab || "toys");
  });
  document.querySelector<HTMLInputElement>('#adminProductForm input[name="image"]')?.addEventListener("change", (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    const preview = document.getElementById("adminImagePreview");
    if (!file || !preview) return;
    preview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
    preview.classList.remove("hidden");
  });
  document.querySelectorAll<HTMLButtonElement>(".auth-tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((item) => item.classList.toggle("active", item === tab));
    showProductionAuthForm(tab.dataset.authTab === "register" ? "registerForm" : "loginForm");
  }));
  document.getElementById("forgotPasswordButton")?.addEventListener("click", () => showProductionAuthForm("forgotPasswordForm"));
  document.getElementById("backToLoginButton")?.addEventListener("click", () => showProductionAuthForm("loginForm"));
  document.getElementById("registrationSuccessLogin")?.addEventListener("click", () => showProductionAuthForm("loginForm"));
  document.getElementById("googleAuthButton")?.addEventListener("click", async () => {
    if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Opening Google…" : "Открываем Google…";
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}${location.pathname}` } });
    if (error && accountStatus) accountStatus.textContent = productionMessage(error);
  });
  document.querySelectorAll<HTMLButtonElement>(".password-toggle").forEach((button) => button.addEventListener("click", () => {
    const input = button.parentElement?.querySelector<HTMLInputElement>('input[type="password"],input[type="text"]');
    if (!input) return;
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? (currentLanguage !== "ru" ? "Hide" : "Скрыть") : (currentLanguage !== "ru" ? "Show" : "Показать");
    button.setAttribute("aria-label", button.textContent);
  }));
  const registrationPassword = document.querySelector<HTMLInputElement>('#registerForm input[name="password"]');
  registrationPassword?.addEventListener("input", () => {
    const value = registrationPassword.value;
    const score = Math.min(4, Number(value.length >= 8) + Number(/[a-zа-я]/i.test(value) && /[A-ZА-Я]/.test(value)) + Number(/\d/.test(value)) + Number(/[^\wа-яА-Я]/.test(value)));
    const strength = document.getElementById("passwordStrength");
    if (!strength) return;
    strength.dataset.score = String(score);
    const labels = currentLanguage !== "ru" ? ["Use at least 8 characters", "Weak password", "Fair password", "Good password", "Strong password"] : ["Используйте минимум 8 символов", "Слабый пароль", "Средний пароль", "Хороший пароль", "Надёжный пароль"];
    const label = strength.querySelector("span"); if (label) label.textContent = labels[score];
  });
  document.getElementById("forgotPasswordForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.resetPasswordForEmail(String(data.get("email")).trim(), { redirectTo: `${location.origin}${location.pathname}?reset-password=1` });
    if (accountStatus) accountStatus.textContent = error ? productionMessage(error) : (currentLanguage !== "ru" ? "Check your email for the reset link." : "Проверьте почту — ссылка для смены пароля отправлена.");
  });
  document.getElementById("resetPasswordForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form);
    const password = String(data.get("password")); const confirmation = String(data.get("passwordConfirm"));
    if (password !== confirmation) { if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Passwords do not match." : "Пароли не совпадают."; return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (accountStatus) accountStatus.textContent = error ? productionMessage(error) : (currentLanguage !== "ru" ? "Password updated." : "Новый пароль сохранён.");
    if (!error) { history.replaceState({}, "", location.pathname); showProductionAuthForm("loginForm"); }
  });
  document.getElementById("registerForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form);
    const password = String(data.get("password"));
    if (password !== String(data.get("passwordConfirm"))) { if (accountStatus) accountStatus.textContent = currentLanguage !== "ru" ? "Passwords do not match." : "Пароли не совпадают."; return; }
    const { error } = await supabase.auth.signUp({ email: String(data.get("email")).trim(), password, options: { data: { display_name: String(data.get("name")).trim(), account_owner_is_adult: true, privacy_consent_at: new Date().toISOString() }, emailRedirectTo: location.origin + location.pathname } });
    if (error) { if (accountStatus) accountStatus.textContent = productionMessage(error); return; }
    form.reset(); document.querySelector(".auth-tabs")?.classList.add("hidden"); form.classList.add("hidden"); document.getElementById("registrationSuccess")?.classList.remove("hidden");
    if (accountStatus) accountStatus.textContent = "";
  });
  document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.signInWithPassword({ email: String(data.get("email")).trim(), password: String(data.get("password")) });
    if (accountStatus) accountStatus.textContent = error ? productionMessage(error) : "";
    if (!error) await loadProductionAccount();
  });
  document.getElementById("logoutButton")?.addEventListener("click", async () => { await supabase.auth.signOut(); await loadProductionAccount(); });
  document.getElementById("nfcForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const token = String(new FormData(event.currentTarget as HTMLFormElement).get("code") || ""); await claimProductionPassport(token); });
  document.addEventListener("click", (event) => { const button = (event.target as HTMLElement).closest<HTMLElement>("[data-production-passport]"); if (button?.dataset.productionPassport) void openProductionPassport(button.dataset.productionPassport); });
  document.querySelectorAll("[data-close-passport]").forEach((button) => button.addEventListener("click", () => document.getElementById("passportModal")?.classList.remove("open")));
  document.getElementById("memoryForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); if (!activePassportId) return; const form = event.currentTarget as HTMLFormElement; const data = new FormData(form);
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { error } = await supabase.from("toy_memories").insert({ passport_id: activePassportId, owner_id: user.id, title: String(data.get("title")).trim(), body: String(data.get("text")).trim() });
    if (!error) { form.reset(); await openProductionPassport(activePassportId); }
  });
  document.getElementById("passportTransferForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); if (!activePassportId) return; const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const status = document.getElementById("passportTransferStatus");
    const { data: token, error } = await supabase.rpc("create_passport_transfer", { target_passport: activePassportId, recipient_email: String(data.get("email")).trim() });
    if (error || !token) { if (status) status.textContent = currentLanguage !== "ru" ? "Recipient must have a different registered VIORI account." : "Получатель должен иметь другой зарегистрированный аккаунт VIORI."; return; }
    const url = `${location.origin}${location.pathname}?transfer=${encodeURIComponent(token)}`;
    if (status) status.textContent = `${currentLanguage !== "ru" ? "Send this one-time link" : "Отправьте одноразовую ссылку"}: ${url}`;
    form.reset();
  });
  document.getElementById("nfcIssueForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const status = document.getElementById("nfcIssueStatus");
    const { data: result, error } = await supabase.rpc("issue_nfc_passport", { name_ru: String(data.get("nameRu")), name_en: String(data.get("nameEn")), target_order_number: String(data.get("orderNumber")) || null });
    if (error || !result?.[0]) { if (status) status.textContent = productionMessage(error); return; }
    // Два разных кода: публичный уходит в чип, одноразовый печатается
    // на карточке в коробке. В чипе кода активации быть не должно.
    //
    // Адрес для чипа берём постоянный, а не текущий: админку открывают
    // на 127.0.0.1, и такая метка на телефоне ведёт в никуда — телефон
    // считает 127.0.0.1 самим собой. Записать её на игрушку значило бы
    // отправить клиенту нерабочий паспорт.
    const code = encodeURIComponent(result[0].public_code);
    const chipUrl = `${PUBLIC_SITE_URL}passport.html?code=${code}`;
    const localUrl = `${location.href.replace(/[^/]*$/, "")}passport.html?code=${code}`;
    if (status) {
      status.textContent = label(
        `Записать в чип: ${chipUrl} · Напечатать на карточке: ${result[0].claim_token} (показывается один раз) · Для проверки на этом компьютере: ${localUrl}`,
        `Записати в чіп: ${chipUrl} · Надрукувати на картці: ${result[0].claim_token} (показується один раз) · Для перевірки на цьому комп'ютері: ${localUrl}`,
        `Write on the chip: ${chipUrl} · Print on the card: ${result[0].claim_token} (shown once) · For testing on this computer: ${localUrl}`
      );
    }
    form.reset(); await loadProductionAdmin();
  });
  document.getElementById("adminProductForm")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const data = new FormData(form); const status = document.getElementById("adminStatus");
    const slug = `${String(data.get("nameEn")).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    const { data: product, error } = await supabase.from("products").insert({ slug, name_ru: String(data.get("nameRu")).trim(), name_en: String(data.get("nameEn")).trim(), category: String(data.get("category")), price_cents: Math.round(Number(data.get("price")) * 100), description_ru: String(data.get("descriptionRu")).trim(), description_en: String(data.get("descriptionEn")).trim(), is_active: true }).select("id").single();
    if (error || !product) { if (status) status.textContent = productionMessage(error); return; }
    const file = data.get("image");
    if (file instanceof File && file.size) {
      const path = `${product.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
      if (!upload.error) await supabase.from("product_images").insert({ product_id: product.id, storage_path: path, alt_ru: String(data.get("nameRu")), alt_en: String(data.get("nameEn")) });
    }
    form.reset(); if (status) status.textContent = currentLanguage !== "ru" ? "Published in the toy catalogue." : "Игрушка опубликована в каталоге."; await loadProductionAdmin();
  });
  document.addEventListener("click", async (event) => { const button = (event.target as HTMLElement).closest<HTMLElement>("[data-delete-db-product]"); if (!button?.dataset.deleteDbProduct) return; await supabase.from("products").delete().eq("id", button.dataset.deleteDbProduct); await loadProductionAdmin(); });
  document.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-toggle-db-product]");
    if (!button?.dataset.toggleDbProduct || productionProfile?.role !== "admin") return;
    const { error } = await supabase.from("products").update({ is_active: button.dataset.nextActive === "true" }).eq("id", button.dataset.toggleDbProduct);
    if (error) { if (document.getElementById("adminStatus")) document.getElementById("adminStatus")!.textContent = productionMessage(error); return; }
    await loadProductionAdmin();
  });
  document.addEventListener("change", async (event) => {
    const select = (event.target as HTMLElement).closest<HTMLSelectElement>("[data-db-order]");
    if (!select?.dataset.dbOrder || productionProfile?.role !== "admin") return;
    const { error } = await supabase.from("orders").update({ status: select.value }).eq("id", select.dataset.dbOrder);
    if (error) { select.value = productionOrders.find((order) => order.id === select.dataset.dbOrder)?.status || "new"; return; }
    await loadProductionAccount();
  });
  document.getElementById("passportNameForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activePassportId) return;
    const form = event.currentTarget as HTMLFormElement;
    const status = document.getElementById("passportNameStatus");
    const name = String(new FormData(form).get("name") || "").trim();
    const { error } = await supabase.rpc("set_passport_name", { target_passport: activePassportId, new_name: name });
    if (status) status.textContent = error
      ? productionMessage(error)
      : (currentLanguage !== "ru" ? "Name saved." : "Имя сохранено.");
    if (!error) { await loadProductionAccount(); await openProductionPassport(activePassportId); }
  });
  // Удаление паспорта необратимо и уносит с собой главы истории,
  // поэтому спрашиваем подтверждение с кодом конкретного паспорта.
  document.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-delete-passport]");
    if (!button?.dataset.deletePassport || productionProfile?.role !== "admin") return;
    const code = button.dataset.passportCode || "";
    const question = currentLanguage !== "ru"
      ? `Delete passport ${code}? Its story chapters will be lost for good.`
      : `Удалить паспорт ${code}? Главы его истории пропадут безвозвратно.`;
    if (!window.confirm(question)) return;
    const status = document.getElementById("nfcIssueStatus");
    const { error } = await supabase.from("nfc_passports").delete().eq("id", button.dataset.deletePassport);
    if (status) status.textContent = error
      ? productionMessage(error)
      : (currentLanguage !== "ru" ? "Passport deleted." : "Паспорт удалён.");
    if (!error) await loadProductionAdmin();
  });
  // Переключатель языков в редакторе сказки: показываем одно поле за раз.
  document.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-story-lang]");
    const form = button?.closest<HTMLFormElement>("form");
    if (!button?.dataset.storyLang || !form) return;
    openStoryPassportId = form.dataset.passportStory || openStoryPassportId;
    form.querySelectorAll(".story-lang").forEach((item) => item.classList.toggle("active", item === button));
    form.querySelectorAll<HTMLElement>("[data-story-field]").forEach((field) =>
      field.classList.toggle("active", field.dataset.storyField === button.dataset.storyLang));
  });
  document.addEventListener("submit", async (event) => {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>("[data-passport-story]");
    if (!form?.dataset.passportStory || productionProfile?.role !== "admin") return;
    event.preventDefault();
    const passportId = form.dataset.passportStory;
    const data = new FormData(form);
    // Сообщение показываем рядом с формой, а не в шапке страницы:
    // список длинный, и наверх никто не смотрит.
    const status = form.querySelector<HTMLElement>("[data-story-status]");
    openStoryPassportId = passportId;
    // Пустые языки не храним — иначе страница покажет пустую сказку
    // вместо того, чтобы взять запасной язык.
    const story: Record<string, string> = {};
    (["ru", "uk", "en", "nl", "de", "fr"] as Language[]).forEach((code) => {
      const text = String(data.get(`story_${code}`) || "").trim();
      if (text) story[code] = text;
    });
    const update: Record<string, unknown> = { story };
    // Фотографии паспортов лежат в том же публичном бакете, что и товары,
    // но в отдельной папке.
    const photo = data.get("photo");
    if (photo instanceof File && photo.size) {
      const path = `passports/${passportId}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage.from("product-images").upload(path, photo, { contentType: photo.type, upsert: false });
      if (upload.error) { storySavedMessage = productionMessage(upload.error); if (status) status.textContent = storySavedMessage; return; }
      update.photo_path = path;
    }
    const { error } = await supabase.from("nfc_passports").update(update).eq("id", passportId);
    storySavedMessage = error
      ? productionMessage(error)
      : label("Сказка сохранена.", "Казку збережено.", "Story saved.");
    if (status) status.textContent = storySavedMessage;
    if (!error) await loadProductionAdmin();
  });
  document.addEventListener("change", async (event) => {
    const select = (event.target as HTMLElement).closest<HTMLSelectElement>("[data-request]");
    if (!select?.dataset.request || productionProfile?.role !== "admin") return;
    const requestId = select.dataset.request;
    const { error } = await supabase.from("custom_requests").update({ status: select.value }).eq("id", requestId);
    if (error) {
      select.value = productionRequests.find((request) => request.id === requestId)?.status || "new";
      if (accountStatus) accountStatus.textContent = productionMessage(error);
      return;
    }
    await loadProductionAdmin();
  });
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") { productionOpenAccount(); authView?.classList.remove("hidden"); dashboardView?.classList.add("hidden"); showProductionAuthForm("resetPasswordForm"); return; }
    if (event === "SIGNED_IN" && arrivedFromOAuth) productionOpenAccount();
    window.setTimeout(() => void loadProductionAccount().catch((error) => { if (accountStatus) accountStatus.textContent = productionMessage(error); }), 0);
  });
  void loadProductionAccount().catch((error) => { if (accountStatus) accountStatus.textContent = productionMessage(error); });
}

document.getElementById("year")!.textContent = String(new Date().getFullYear());

setLanguage(localStorage.getItem("viori-language") || "ru");

if (new URLSearchParams(window.location.search).has("nfc")) {
  if (supabase) productionOpenAccount(); else openAccount();
  // Человек пришёл с кодом активации и видит форму входа без объяснений.
  // Говорим прямо, зачем она.
  // Если человек уже вошёл, claimProductionPassport перезапишет это
  // сообщение результатом активации через мгновение.
  if (accountStatus) {
    accountStatus.textContent = label(
      "Войдите или создайте аккаунт — и паспорт игрушки активируется автоматически.",
      "Увійдіть або створіть акаунт — і паспорт іграшки активується автоматично.",
      "Sign in or create an account and the toy's passport will be activated automatically."
    );
  }
}
if (new URLSearchParams(window.location.search).has("account")) {
  window.setTimeout(() => { if (supabase) productionOpenAccount(); else openAccount(); }, 0);
}
// Из каталога товар кладётся в корзину и пользователь приходит сюда по ?cart=1.
// Клик по кнопке, а не прямой вызов: обработчик висит на ней в обеих ветках.
if (new URLSearchParams(window.location.search).has("cart")) {
  window.setTimeout(() => document.getElementById("openCart")?.click(), 0);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
