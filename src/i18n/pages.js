// Static content pages: policies + heritage/craftsmanship.
// Section = { h: [ta,en,ml], p: [ta,en,ml] }.
// NOTE: the policy wording below is a reasonable DRAFT for the owner / a legal adviser to confirm
// (timelines such as the 48-hour damage window and 5-7 day refunds are placeholders).
const S = (h, p) => ({ h, p });

export const PAGES = {
  privacy: {
    title: ['தனியுரிமைக் கொள்கை', 'Privacy Policy', 'സ്വകാര്യതാ നയം'],
    sections: [
      S(['நாங்கள் சேகரிப்பவை', 'What we collect', 'ഞങ്ങൾ ശേഖരിക്കുന്നവ'], [
        'உங்கள் பெயர், கைபேசி எண், வயது, விருப்ப மொழி, (விருப்பமிருந்தால்) மின்னஞ்சல், டெலிவரி முகவரிகள், ஆர்டர் விவரங்கள். கட்டணத்தை Razorpay கையாள்கிறது; உங்கள் கார்டு / UPI விவரங்களை நாங்கள் பார்ப்பதும் சேமிப்பதும் இல்லை.',
        'Your name, mobile number, age, preferred language, email (if you add one), delivery addresses and order details. Payments are handled by Razorpay; we never see or store your card or UPI details.',
        'നിങ്ങളുടെ പേര്, മൊബൈൽ നമ്പർ, പ്രായം, ഇഷ്ട ഭാഷ, (ചേർത്താൽ) ഇമെയിൽ, ഡെലിവറി വിലാസങ്ങൾ, ഓർഡർ വിവരങ്ങൾ. പേയ്മെന്റ് Razorpay കൈകാര്യം ചെയ്യുന്നു; നിങ്ങളുടെ കാർഡ് / UPI വിവരങ്ങൾ ഞങ്ങൾ കാണുകയോ സൂക്ഷിക്കുകയോ ചെയ്യുന്നില്ല.',
      ]),
      S(['எப்படிப் பயன்படுத்துகிறோம்', 'How we use it', 'എങ്ങനെ ഉപയോഗിക്കുന്നു'], [
        'கணக்கை உருவாக்க, ஆர்டரை அனுப்ப, ஆர்டர் நிலை மற்றும் சரிபார்ப்புக் குறியீடுகளைத் தெரிவிக்க, உங்கள் கேள்விகளுக்குப் பதிலளிக்க மட்டும். உங்கள் தகவலை நாங்கள் விற்பதில்லை.',
        'To create your account, deliver your order, send order updates and verification codes, and answer your questions. We do not sell your personal information.',
        'അക്കൗണ്ട് ഉണ്ടാക്കാനും ഓർഡർ എത്തിക്കാനും ഓർഡർ വിവരങ്ങളും സ്ഥിരീകരണ കോഡുകളും അറിയിക്കാനും നിങ്ങളുടെ ചോദ്യങ്ങൾക്ക് മറുപടി നൽകാനും മാത്രം. നിങ്ങളുടെ വിവരങ്ങൾ ഞങ്ങൾ വിൽക്കുന്നില്ല.',
      ]),
      S(['பாதுகாப்பு', 'Security', 'സുരക്ഷ'], [
        'கடவுச்சொற்கள் குறியாக்கப்பட்ட (hash) வடிவில் மட்டுமே சேமிக்கப்படுகின்றன; எங்களால் அவற்றைப் படிக்க இயலாது. உங்கள் ஆர்டர்களை நீங்கள் மட்டுமே பார்க்க முடியும்.',
        'Passwords are stored only in hashed form, so even we cannot read them. Only you can see your own orders.',
        'പാസ്‌വേഡുകൾ ഹാഷ് രൂപത്തിൽ മാത്രമാണ് സൂക്ഷിക്കുന്നത്; ഞങ്ങൾക്കു പോലും അവ വായിക്കാനാവില്ല. നിങ്ങളുടെ ഓർഡറുകൾ നിങ്ങൾക്കു മാത്രമേ കാണാനാകൂ.',
      ]),
      S(['உங்கள் உரிமைகள்', 'Your choices', 'നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾ'], [
        'உங்கள் தகவலைத் திருத்த அல்லது நீக்கக் கோர, “தொடர்பு கொள்ள” பக்கத்தின் மூலம் எங்களை அணுகுங்கள்.',
        'To correct or delete your information, contact us through the Contact page.',
        'വിവരങ്ങൾ തിരുത്താനോ നീക്കം ചെയ്യാനോ “ബന്ധപ്പെടുക” പേജ് വഴി ഞങ്ങളെ സമീപിക്കുക.',
      ]),
    ],
  },
  terms: {
    title: ['விதிமுறைகள்', 'Terms & Conditions', 'നിബന്ധനകൾ'],
    sections: [
      S(['இணையதளப் பயன்பாடு', 'Using this website', 'വെബ്സൈറ്റ് ഉപയോഗം'], [
        'POOMPAVAI இணையதளத்தைப் பார்வையிட கணக்கு தேவையில்லை. ஆர்டர் செய்யும்போது நீங்கள் தரும் தகவல் சரியானதாக இருக்க வேண்டும்; கணக்கின் பாதுகாப்பும் உங்கள் பொறுப்பு.',
        'You do not need an account to browse POOMPAVAI. Information you give when ordering must be accurate, and you are responsible for keeping your account secure.',
        'POOMPAVAI വെബ്സൈറ്റ് കാണാൻ അക്കൗണ്ട് ആവശ്യമില്ല. ഓർഡർ ചെയ്യുമ്പോൾ നൽകുന്ന വിവരങ്ങൾ ശരിയായിരിക്കണം; അക്കൗണ്ടിന്റെ സുരക്ഷ നിങ്ങളുടെ ഉത്തരവാദിത്തമാണ്.',
      ]),
      S(['விலையும் ஆர்டரும்', 'Prices and orders', 'വിലയും ഓർഡറും'], [
        'விலைகள் இந்திய ரூபாயில் காட்டப்படுகின்றன. பணம் செலுத்தி, சரிபார்க்கப்பட்ட பின்னரே ஆர்டர் உறுதியாகும். விலைகள் முன்னறிவிப்பின்றி மாறலாம்; ஏற்கெனவே உறுதியான ஆர்டர்களுக்கு அது பொருந்தாது.',
        'Prices are shown in Indian rupees. An order is confirmed only after payment is made and verified. Prices may change without notice, but never for an order already confirmed.',
        'വിലകൾ ഇന്ത്യൻ രൂപയിലാണ്. പണമടച്ച് സ്ഥിരീകരിച്ച ശേഷമാണ് ഓർഡർ ഉറപ്പാകുന്നത്. വിലകൾ അറിയിപ്പില്ലാതെ മാറാം; എന്നാൽ ഉറപ്പായ ഓർഡറുകളെ ബാധിക്കില്ല.',
      ]),
      S(['கைவினைப் பொருட்கள்', 'Handmade products', 'കൈത്തൊഴിൽ ഉൽപ്പന്നങ്ങൾ'], [
        'எங்கள் பொம்மைகள் கையால் செய்யப்படுபவை. படங்களில் உள்ளதைவிட நிறத்திலும் வேலைப்பாட்டிலும் சிறு வேறுபாடுகள் இருக்கலாம்; அது கைவினையின் இயல்பு.',
        'Our dolls are handmade. Small differences in colour and detail from the photographs are natural to the craft.',
        'ഞങ്ങളുടെ പാവകൾ കൈകൊണ്ട് നിർമ്മിച്ചവയാണ്. ചിത്രങ്ങളെ അപേക്ഷിച്ച് നിറത്തിലും വിശദാംശങ്ങളിലും ചെറിയ വ്യത്യാസങ്ങൾ ഉണ്ടാകാം; ഇത് കരകൗശലത്തിന്റെ സ്വഭാവമാണ്.',
      ]),
      S(['பொருந்தும் சட்டம்', 'Governing law', 'ബാധകമായ നിയമം'], [
        'இந்த விதிமுறைகள் இந்தியச் சட்டங்களுக்கு உட்பட்டவை.',
        'These terms are governed by the laws of India.',
        'ഈ നിബന്ധനകൾ ഇന്ത്യൻ നിയമങ്ങൾക്ക് വിധേയമാണ്.',
      ]),
    ],
  },
  shipping: {
    title: ['அனுப்புதல் கொள்கை', 'Shipping Policy', 'ഷിപ്പിംഗ് നയം'],
    sections: [
      S(['எங்கே அனுப்புகிறோம்', 'Where we ship', 'എവിടേക്ക് അയയ്ക്കുന്നു'], [
        'இந்தியா முழுவதும் அனுப்புகிறோம். வெளிநாட்டு ஆர்டர்களுக்கு எங்களைத் தொடர்பு கொள்ளுங்கள்.',
        'We ship across India. For international orders, please contact us.',
        'ഇന്ത്യയൊട്ടാകെ അയയ്ക്കുന്നു. വിദേശ ഓർഡറുകൾക്ക് ഞങ്ങളെ ബന്ധപ്പെടുക.',
      ]),
      S(['தயாரிப்பும் டெலிவரியும்', 'Processing and delivery', 'തയ്യാറാക്കലും ഡെലിവറിയും'], [
        'ஆர்டரைத் தயார் செய்யவும் பேக் செய்யவும் சில வணிக நாட்கள் ஆகும். பணம் செலுத்தும் முன் உங்கள் முகவரிக்கான எதிர்பார்க்கும் டெலிவரி நாட்கள் காட்டப்படும். இது மதிப்பீடு; கூரியர் தாமதங்கள் ஏற்படலாம்.',
        'A few business days are needed to prepare and pack your order. Before you pay, we show the estimated delivery for your address. This is an estimate; courier delays can happen.',
        'ഓർഡർ തയ്യാറാക്കി പാക്ക് ചെയ്യാൻ ഏതാനും പ്രവൃത്തി ദിവസം വേണം. പണമടയ്ക്കും മുമ്പ് നിങ്ങളുടെ വിലാസത്തിലേക്കുള്ള പ്രതീക്ഷിത ഡെലിവറി ദിവസങ്ങൾ കാണിക്കും. ഇത് ഏകദേശ കണക്കാണ്; കൊറിയർ കാലതാമസം ഉണ്ടാകാം.',
      ]),
      S(['கண்காணிப்பு', 'Tracking', 'ട്രാക്കിംഗ്'], [
        'ஒவ்வொரு ஆர்டரின் நிலையையும் “என் கணக்கு” பகுதியில் பார்க்கலாம். அனுப்பியதும் கூரியர் பெயரும் டிராக்கிங் எண்ணும் அங்கே தோன்றும்.',
        'You can follow every order in My Account. Once shipped, the courier name and tracking number appear there.',
        'ഓരോ ഓർഡറിന്റെയും നില “എന്റെ അക്കൗണ്ട്” ഭാഗത്ത് കാണാം. അയച്ചാൽ കൊറിയർ പേരും ട്രാക്കിംഗ് നമ്പറും അവിടെ വരും.',
      ]),
      S(['முகவரி', 'Address accuracy', 'വിലാസത്തിന്റെ കൃത്യത'], [
        'தவறான முகவரியால் ஏற்படும் தாமதத்திற்கு நாங்கள் பொறுப்பாக முடியாது. அனுப்பும் முன் முகவரியைச் சரிபார்க்கவும்.',
        'We cannot be responsible for delays caused by an incorrect address. Please check your address before paying.',
        'തെറ്റായ വിലാസം കാരണമുള്ള കാലതാമസത്തിന് ഞങ്ങൾക്ക് ഉത്തരവാദിത്തം ഏൽക്കാനാവില്ല. പണമടയ്ക്കും മുമ്പ് വിലാസം പരിശോധിക്കുക.',
      ]),
    ],
  },
  cancellation: {
    title: ['ரத்து செய்யும் கொள்கை', 'Cancellation Policy', 'റദ്ദാക്കൽ നയം'],
    sections: [
      S(['அனுப்புவதற்கு முன்', 'Before shipping', 'അയയ്ക്കുന്നതിന് മുമ്പ്'], [
        'ஆர்டர் அனுப்பப்படுவதற்கு முன் ரத்து செய்யலாம். விரைவில் எங்களைத் தொடர்பு கொள்ளுங்கள். ரத்து செய்தால் செலுத்திய தொகை திருப்பி அளிக்கப்படும்.',
        'You can cancel an order before it is shipped. Please contact us as early as possible. A cancelled order is refunded in full.',
        'ഓർഡർ അയയ്ക്കുന്നതിന് മുമ്പ് റദ്ദാക്കാം. എത്രയും വേഗം ഞങ്ങളെ ബന്ധപ്പെടുക. റദ്ദാക്കിയാൽ അടച്ച തുക പൂർണ്ണമായി തിരികെ നൽകും.',
      ]),
      S(['அனுப்பிய பின்', 'After shipping', 'അയച്ചതിന് ശേഷം'], [
        'அனுப்பப்பட்ட ஆர்டரை ரத்து செய்ய இயலாது; பொருள் வந்தபின் திருப்பியளிப்புக் கொள்கையின்படி உதவுவோம்.',
        'An order that has already shipped cannot be cancelled; once it arrives we will help under the Return / Refund Policy.',
        'അയച്ച ഓർഡർ റദ്ദാക്കാൻ കഴിയില്ല; എത്തിയ ശേഷം റിട്ടേൺ / റീഫണ്ട് നയപ്രകാരം സഹായിക്കാം.',
      ]),
    ],
  },
  refund: {
    title: ['திருப்பியளிப்பு / பணம் திரும்பக் கொள்கை', 'Refund / Return Policy', 'റീഫണ്ട് / റിട്ടേൺ നയം'],
    sections: [
      S(['சேதம் அல்லது தவறான பொருள்', 'Damaged or incorrect items', 'കേടായതോ തെറ്റായതോ ആയ ഉൽപ്പന്നം'], [
        'பொம்மை சேதமடைந்து வந்தால் அல்லது தவறான பொம்மை வந்தால், டெலிவரி ஆன 48 மணி நேரத்திற்குள் பெட்டியைத் திறக்கும் படங்களுடன் எங்களுக்குத் தெரிவியுங்கள். மாற்றுப் பொம்மை அல்லது பணம் திரும்ப வழங்குவோம்.',
        'If your doll arrives damaged or is not the one you ordered, tell us within 48 hours of delivery with photos of the unopened box and the doll. We will replace it or refund you.',
        'പാവ കേടായോ ഓർഡർ ചെയ്തതല്ലാത്തതോ ആയി എത്തിയാൽ, ഡെലിവറി കഴിഞ്ഞ് 48 മണിക്കൂറിനുള്ളിൽ പെട്ടിയുടെയും പാവയുടെയും ഫോട്ടോകളോടെ ഞങ്ങളെ അറിയിക്കുക. മാറ്റി നൽകുകയോ പണം തിരികെ നൽകുകയോ ചെയ്യും.',
      ]),
      S(['கைவினை வேறுபாடுகள்', 'Handmade variation', 'കൈത്തൊഴിൽ വ്യത്യാസങ്ങൾ'], [
        'கையால் செய்யப்படுவதால் ஏற்படும் சிறு நிற அல்லது வேலைப்பாட்டு வேறுபாடுகள் குறைபாடாகக் கருதப்படாது.',
        'Small variations in colour or detail that come from handmade work are not considered defects.',
        'കൈകൊണ്ട് നിർമ്മിക്കുന്നതിനാൽ ഉണ്ടാകുന്ന ചെറിയ നിറ / വിശദാംശ വ്യത്യാസങ്ങൾ കുറവായി കണക്കാക്കില്ല.',
      ]),
      S(['பணம் திரும்ப', 'How refunds are paid', 'റീഫണ്ട് എങ്ങനെ'], [
        'ஒப்புதலுக்குப் பிறகு, செலுத்திய அதே முறையில் சில வணிக நாட்களில் பணம் திரும்பச் செலுத்தப்படும்.',
        'After approval, refunds go back to the original payment method within a few business days.',
        'അംഗീകാരത്തിന് ശേഷം, പണമടച്ച അതേ രീതിയിലേക്ക് ഏതാനും പ്രവൃത്തി ദിവസത്തിനുള്ളിൽ തുക തിരികെ ലഭിക്കും.',
      ]),
    ],
  },
  heritage: {
    title: ['தஞ்சாவூர் பாரம்பரியம்', 'Thanjavur Heritage', 'തഞ്ചാവൂർ പൈതൃകം'],
    sections: [
      S(['தஞ்சையும் அதன் கலைகளும்', 'Thanjavur and its arts', 'തഞ്ചാവൂരും അതിന്റെ കലകളും'], [
        'கோயில்களுக்கும், இசை நடனக் கலைகளுக்கும், கைவினைகளுக்கும் தஞ்சாவூர் தமிழ்நாடு முழுவதும் அறியப்பட்டது. தலையாட்டி பொம்மை இந்த மரபின் ஒரு பகுதி.',
        'Thanjavur is known across Tamil Nadu for its temples, its music and dance, and its handicrafts. The Thalaiyatti Bommai belongs to this tradition.',
        'ക്ഷേത്രങ്ങൾ, സംഗീതം, നൃത്തം, കരകൗശലങ്ങൾ എന്നിവയ്ക്ക് തഞ്ചാവൂർ തമിഴ്‌നാട്ടിലുടനീളം അറിയപ്പെടുന്നു. ഈ പാരമ്പര്യത്തിന്റെ ഭാഗമാണ് തലയാട്ടി ബൊമ്മ.',
      ]),
      S(['தலையசைவின் ரகசியம்', 'The secret of the nod', 'തല ആട്ടത്തിന്റെ രഹസ്യം'], [
        'கனமான, உருண்டையான அடிப்பாகம் பொம்மையை மெதுவாக ஆடவைத்து மீண்டும் சமநிலைக்குக் கொண்டுவருகிறது. அந்த மென்மையான அசைவுதான் இதன் அடையாளம்.',
        'The weighted, rounded base lets the doll sway and then settle gently back. That soft movement is its signature.',
        'ഭാരമുള്ള, ഉരുണ്ട അടിഭാഗം പാവയെ പതുക്കെ ആടാനും വീണ്ടും സമതുലനത്തിലെത്താനും സഹായിക്കുന്നു. ആ മൃദുവായ ചലനമാണ് ഇതിന്റെ അടയാളം.',
      ]),
      S(['கொலுவும் இல்லமும்', 'Golu and the home', 'കൊലുവും വീടും'], [
        'தலையாட்டி பொம்மைகள் தஞ்சாவூர் இல்லங்களிலும் கொலு அலங்காரங்களிலும் பழக்கமான காட்சி.',
        'Thalaiyatti Bommais are a familiar sight in Thanjavur homes and Golu displays.',
        'തലയാട്ടി ബൊമ്മകൾ തഞ്ചാവൂരിലെ വീടുകളിലും കൊലു അലങ്കാരങ്ങളിലും പരിചിതമായ കാഴ്ചയാണ്.',
      ]),
    ],
  },
  craftsmanship: {
    title: ['கைவினைத்திறன்', 'Craftsmanship', 'കരകൗശലം'],
    sections: [
      S(['கையால் உருவாகிறது', 'Made by hand', 'കൈകൊണ്ട് രൂപപ്പെടുന്നു'], [
        'ஒவ்வொரு பொம்மையும் கையால் வடிவமைத்து, உலர்த்தி, வண்ணம் தீட்டப்படுகிறது. நிறத்திலும் வேலைப்பாட்டிலும் சிறு வேறுபாடுகள் இருப்பதால் ஒவ்வொன்றும் தனித்துவமானது.',
        'Each doll is shaped, dried and painted by hand. Small variations in colour and detail make every doll one of a kind.',
        'ഓരോ പാവയും കൈകൊണ്ട് രൂപപ്പെടുത്തി, ഉണക്കി, ചായം പൂശുന്നു. നിറത്തിലും വിശദാംശങ്ങളിലുമുള്ള ചെറിയ വ്യത്യാസങ്ങൾ ഓരോ പാവയെയും സവിശേഷമാക്കുന്നു.',
      ]),
      S(['பராமரிப்பு', 'Caring for your doll', 'പാവയുടെ പരിപാലനം'], [
        'ஈரம் படாமலும் நேரடி வெயிலில் படாமலும் வையுங்கள். மென்மையான உலர்ந்த துணியால் மெதுவாகத் துடையுங்கள். பொம்மையை அடிப்பாகத்தில் பிடியுங்கள், தலையில் அல்ல.',
        'Keep it dry and away from direct sunlight. Dust gently with a soft, dry cloth. Hold the doll by its base, never by the head.',
        'നനയാതെയും നേരിട്ടുള്ള വെയിൽ ഏൽക്കാതെയും സൂക്ഷിക്കുക. മൃദുവായ ഉണങ്ങിയ തുണികൊണ്ട് പതുക്കെ തുടയ്ക്കുക. പാവയെ അടിഭാഗത്ത് പിടിക്കുക, തലയിൽ അരുത്.',
      ]),
    ],
  },
};
