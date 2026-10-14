// Seeds the 4 launch products from doll-img/ and default delivery settings.
// Prices, sizes, weights and stock are PLACEHOLDERS - edit them in Super Admin > Products.
// Safe to re-run: existing products (and any admin edits) are left untouched.
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const story = {
  en: 'Thalaiyatti Bommai means “head-nodding doll”. A weighted, rounded base lets the figure sway and the head nod at the lightest touch, then settle gently back. It is a familiar presence in Thanjavur homes and Golu displays.',
  ta: 'தலையாட்டி பொம்மை என்றால் தலை ஆடும் பொம்மை. கனமான, உருண்டையான அடிப்பாகம் இருப்பதால், லேசாகத் தொட்டாலே தலை அசைந்து ஆடி, மெதுவாக மீண்டும் சமநிலைக்கு வரும். தஞ்சாவூர் இல்லங்களிலும் கொலு அலங்காரங்களிலும் இது பழக்கமான காட்சி.',
  ml: 'തലയാട്ടി ബൊമ്മ എന്നാൽ തല ആടുന്ന പാവ. ഭാരമുള്ള, ഉരുണ്ട അടിഭാഗം ഉള്ളതിനാൽ ഒന്നു തൊട്ടാൽ തല ആടുകയും പതുക്കെ വീണ്ടും സമതുലനത്തിലേക്ക് വരികയും ചെയ്യും. തഞ്ചാവൂരിലെ വീടുകളിലും കൊലു അലങ്കാരങ്ങളിലും ഇത് പരിചിതമായ കാഴ്ചയാണ്.',
};
const material = {
  en: 'Hand-painted terracotta clay with a weighted base',
  ta: 'கையால் வண்ணம் தீட்டிய களிமண் (டெரகோட்டா), கனமான அடிப்பாகத்துடன்',
  ml: 'കൈകൊണ്ട് ചായം പൂശിയ കളിമണ്ണ് (ടെറാക്കോട്ട), ഭാരമുള്ള അടിഭാഗത്തോടെ',
};
const craftsmanship = {
  en: 'Shaped, dried and painted by hand. Small variations in colour and detail make every doll one of a kind.',
  ta: 'கையால் வடிவமைத்து, உலர்த்தி, வண்ணம் தீட்டப்படுகிறது. நிறத்திலும் வேலைப்பாட்டிலும் சிறு வேறுபாடுகள் இருப்பதால் ஒவ்வொரு பொம்மையும் தனித்துவமானது.',
  ml: 'കൈകൊണ്ട് രൂപപ്പെടുത്തി, ഉണക്കി, ചായം പൂശുന്നു. നിറത്തിലും വിശദാംശങ്ങളിലുമുള്ള ചെറിയ വ്യത്യാസങ്ങൾ കാരണം ഓരോ പാവയും സവിശേഷമാണ്.',
};
const care = {
  en: 'Keep dry and away from direct sunlight. Dust gently with a soft, dry cloth. Hold the doll by its base, never by the head.',
  ta: 'ஈரம் படாமலும் நேரடி வெயிலில் படாமலும் வைக்கவும். மென்மையான உலர்ந்த துணியால் மெதுவாகத் துடைக்கவும். பொம்மையை அடிப்பாகத்தில் பிடிக்கவும், தலையைப் பிடிக்க வேண்டாம்.',
  ml: 'നനയാതെയും നേരിട്ടുള്ള വെയിൽ ഏൽക്കാതെയും സൂക്ഷിക്കുക. മൃദുവായ ഉണങ്ങിയ തുണികൊണ്ട് പതുക്കെ തുടയ്ക്കുക. പാവയെ അടിഭാഗത്ത് പിടിക്കുക, തലയിൽ പിടിക്കരുത്.',
};

const products = [
  {
    slug: 'nartaki-classical-dancer',
    img: 'img1-clean',
    name: { en: 'Nartaki — Classical Dancer', ta: 'நர்த்தகி – பாரம்பரிய நடனப் பெண்', ml: 'നർത്തകി – ക്ലാസിക്കൽ നർത്തകി' },
    shortDesc: {
      en: 'A graceful classical dancer in crimson and green, hands raised in a gentle mudra.',
      ta: 'சிவப்பு, பச்சை உடையில் மென்மையான முத்திரையுடன் கை உயர்த்திய அழகிய பாரம்பரிய நடனப் பெண்.',
      ml: 'ചുവപ്പും പച്ചയും വേഷത്തിൽ, മൃദുവായ മുദ്രയോടെ കൈ ഉയർത്തിയ ഭംഗിയുള്ള ക്ലാസിക്കൽ നർത്തകി.',
    },
    price: 1499, offerPrice: null, heightCm: 23, weightGrams: 450, stock: 10, featured: true, sortOrder: 1,
    alt: { en: 'Thanjavur dancing doll in a red blouse and green skirt', ta: 'சிவப்பு ரவிக்கை, பச்சை பாவாடையில் தஞ்சாவூர் தலையாட்டி பொம்மை', ml: 'ചുവപ്പ് ബ്ലൗസും പച്ച പാവാടയും ധരിച്ച തഞ്ചാവൂർ തലയാട്ടി ബൊമ്മ' },
  },
  {
    slug: 'kathakali-vesham-blue',
    img: 'img2',
    name: { en: 'Kathakali Vesham — Blue', ta: 'கதகளி வேடம் – நீலம்', ml: 'കഥകളി വേഷം – നീല' },
    shortDesc: {
      en: 'A blue-faced Kathakali character in white and gold, a nod to the Kerala stage tradition.',
      ta: 'வெள்ளை, தங்க நிற உடையில் நீல முகம் கொண்ட கதகளி வேடம் — கேரளக் கலை மரபுக்கு ஒரு வணக்கம்.',
      ml: 'വെള്ളയും സ്വർണ്ണവും വേഷത്തിൽ നീല മുഖമുള്ള കഥകളി വേഷം — കേരളത്തിന്റെ കലാപാരമ്പര്യത്തിനുള്ള ഒരു ആദരം.',
    },
    price: 1299, offerPrice: 1099, heightCm: 20, weightGrams: 400, stock: 8, featured: true, sortOrder: 2,
    alt: { en: 'Blue Kathakali-style Thanjavur doll', ta: 'நீல நிற கதகளி பாணி தஞ்சாவூர் தலையாட்டி பொம்மை', ml: 'നീല നിറത്തിലുള്ള കഥകളി ശൈലിയിലെ തഞ്ചാവൂർ ബൊമ്മ' },
  },
  {
    slug: 'raja-rani-pair',
    img: 'img3',
    name: { en: 'Raja & Rani — The Pair', ta: 'ராஜா ராணி ஜோடி', ml: 'രാജാ റാണി ജോഡി' },
    shortDesc: {
      en: 'A king and queen, displayed together — a classic pair for Golu and gifting.',
      ta: 'ராஜாவும் ராணியும் ஒன்றாக — கொலுவுக்கும் பரிசளிக்கவும் ஏற்ற பாரம்பரிய ஜோடி.',
      ml: 'രാജാവും റാണിയും ഒരുമിച്ച് — കൊലുവിനും സമ്മാനമായി നൽകാനും ചേർന്ന പരമ്പരാഗത ജോഡി.',
    },
    price: 2499, offerPrice: null, heightCm: 22, weightGrams: 900, stock: 5, featured: true, sortOrder: 3,
    alt: { en: 'Raja and Rani Thanjavur dancing doll pair', ta: 'ராஜா ராணி தஞ்சாவூர் தலையாட்டி பொம்மை ஜோடி', ml: 'രാജാ റാണി തഞ്ചാവൂർ ബൊമ്മ ജോഡി' },
  },
  {
    slug: 'ratna-nartaki-violet',
    img: 'img4',
    name: { en: 'Ratna Nartaki — Jewelled Dancer', ta: 'ரத்ன நர்த்தகி – ஊதா', ml: 'രത്ന നർത്തകി – വയലറ്റ്' },
    shortDesc: {
      en: 'A dancer in violet, richly adorned with stone work and gold detailing.',
      ta: 'ஊதா நிற உடையில், கற்களாலும் தங்க வேலைப்பாட்டாலும் அலங்கரிக்கப்பட்ட நடனப் பெண்.',
      ml: 'വയലറ്റ് വേഷത്തിൽ, കല്ലുകളും സ്വർണ്ണ വേലയും കൊണ്ട് അലങ്കരിച്ച നർത്തകി.',
    },
    price: 1899, offerPrice: null, heightCm: 25, weightGrams: 500, stock: 6, featured: false, sortOrder: 4,
    alt: { en: 'Violet Thanjavur dancing doll decorated with stones', ta: 'கற்கள் பதித்த ஊதா நிற தஞ்சாவூர் தலையாட்டி பொம்மை', ml: 'കല്ലുകൾ പതിച്ച വയലറ്റ് തഞ്ചാവൂർ തലയാട്ടി ബൊമ്മ' },
  },
];

for (const { img, alt, ...p } of products) {
  const exists = await db.product.findUnique({ where: { slug: p.slug } });
  if (exists) { console.log('skip', p.slug); continue; }
  await db.product.create({
    data: {
      ...p, story, material, craftsmanship, care,
      assets: { create: [{ kind: 'IMAGE', url: `/products/${img}.webp`, alt, sortOrder: 0 }] },
    },
  });
  console.log('created', p.slug);
}

await db.setting.upsert({
  where: { key: 'delivery' },
  update: {},
  create: {
    key: 'delivery',
    value: {
      processingDays: 1,
      defaultZone: { name: 'Rest of India', minDays: 3, maxDays: 5, fee: 0 },
      zones: [
        { name: 'Tamil Nadu', states: ['Tamil Nadu'], minDays: 1, maxDays: 2, fee: 0 },
        { name: 'South India', states: ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry'], minDays: 2, maxDays: 4, fee: 0 },
      ],
      international: { enabled: false, minDays: 10, maxDays: 15, fee: 0 },
    },
  },
});
await db.$disconnect();
