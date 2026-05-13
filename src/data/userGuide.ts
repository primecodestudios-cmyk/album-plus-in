// AlbumPlus User Guide — multilingual content
// Languages: en, ta, hi, te, kn, ml

export type Lang = "en" | "ta" | "hi" | "te" | "kn" | "ml";

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
};

export interface Section {
  id: string;
  icon: string; // lucide icon name
  title: Record<Lang, string>;
  intro?: Record<Lang, string>;
  steps?: Record<Lang, string[]>;
  bullets?: Record<Lang, string[]>;
  note?: Record<Lang, string>;
}

const T = (en: string, ta: string, hi: string, te: string, kn: string, ml: string): Record<Lang, string> =>
  ({ en, ta, hi, te, kn, ml });

const L = (
  en: string[], ta: string[], hi: string[], te: string[], kn: string[], ml: string[]
): Record<Lang, string[]> => ({ en, ta, hi, te, kn, ml });

export const UI_STRINGS: Record<string, Record<Lang, string>> = {
  guide_title: T(
    "AlbumPlus User Guide",
    "AlbumPlus பயனர் வழிகாட்டி",
    "AlbumPlus उपयोगकर्ता गाइड",
    "AlbumPlus యూజర్ గైడ్",
    "AlbumPlus ಬಳಕೆದಾರ ಮಾರ್ಗದರ್ಶಿ",
    "AlbumPlus ഉപയോക്തൃ ഗൈഡ്"
  ),
  guide_subtitle: T(
    "Step-by-step manual to install, register and design albums.",
    "நிறுவுதல், பதிவு மற்றும் ஆல்பம் வடிவமைப்புக்கான படிப்படியான கையேடு.",
    "इंस्टॉल, रजिस्टर और एल्बम डिज़ाइन के लिए चरण-दर-चरण मैनुअल।",
    "ఇన్‌స్టాల్, రిజిస్టర్ మరియు ఆల్బమ్ డిజైన్ కోసం దశల వారీ మాన్యువల్.",
    "ಇನ್‌ಸ್ಟಾಲ್, ನೋಂದಣಿ ಮತ್ತು ಆಲ್ಬಮ್ ವಿನ್ಯಾಸಕ್ಕಾಗಿ ಹಂತ ಹಂತದ ಕೈಪಿಡಿ.",
    "ഇൻസ്റ്റാൾ, രജിസ്റ്റർ, ആൽബം ഡിസൈൻ എന്നിവയ്ക്കായുള്ള ഘട്ടം ഘട്ടമായ മാനുവൽ."
  ),
  language: T("Language", "மொழி", "भाषा", "భాష", "ಭಾಷೆ", "ഭാഷ"),
  steps: T("Steps", "படிகள்", "चरण", "దశలు", "ಹಂತಗಳು", "ഘട്ടങ്ങൾ"),
  important: T("Important", "முக்கியம்", "महत्वपूर्ण", "ముఖ్యమైనది", "ಮುಖ್ಯ", "പ്രധാനം"),
  note: T("Note", "குறிப்பு", "ध्यान दें", "గమనిక", "ಸೂಚನೆ", "കുറിപ്പ്"),
  on_this_page: T("On this page", "இந்த பக்கத்தில்", "इस पृष्ठ पर", "ఈ పేజీలో", "ಈ ಪುಟದಲ್ಲಿ", "ഈ പേജിൽ"),
  contact_support: T("Contact Support", "ஆதரவை தொடர்புகொள்ளவும்", "सहायता संपर्क करें", "మద్దతును సంప్రదించండి", "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ", "സപ്പോർട്ടുമായി ബന്ധപ്പെടുക"),
  whatsapp: T("WhatsApp", "வாட்ஸ்அப்", "व्हाट्सएप", "వాట్సాప్", "ವಾಟ್ಸಾಪ್", "വാട്ട്സ്ആപ്പ്"),
  back_home: T("Back to Home", "முகப்புக்குத் திரும்பு", "होम पर जाएं", "హోమ్‌కు తిరిగి", "ಮುಖಪುಟಕ್ಕೆ ಹಿಂದಿರುಗಿ", "ഹോമിലേക്ക്"),
};

export const SECTIONS: Section[] = [
  {
    id: "intro",
    icon: "BookOpen",
    title: T("Introduction", "அறிமுகம்", "परिचय", "పరిచయం", "ಪರಿಚಯ", "ആമുഖം"),
    intro: T(
      "AlbumPlus is a Windows-based album designing software that works seamlessly with Adobe Photoshop CC.",
      "AlbumPlus என்பது Adobe Photoshop CC உடன் சீராக இயங்கும் Windows ஆல்பம் வடிவமைப்பு மென்பொருள்.",
      "AlbumPlus एक Windows आधारित एल्बम डिज़ाइनिंग सॉफ़्टवेयर है जो Adobe Photoshop CC के साथ काम करता है।",
      "AlbumPlus అనేది Adobe Photoshop CC తో పని చేసే Windows ఆధారిత ఆల్బమ్ డిజైనింగ్ సాఫ్ట్‌వేర్.",
      "AlbumPlus ಎಂಬುದು Adobe Photoshop CC ಯೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವ Windows ಆಧಾರಿತ ಆಲ್ಬಮ್ ವಿನ್ಯಾಸ ಸಾಫ್ಟ್‌ವೇರ್.",
      "AlbumPlus എന്നത് Adobe Photoshop CC യുമായി പ്രവർത്തിക്കുന്ന Windows ആൽബം ഡിസൈനിംഗ് സോഫ്റ്റ്‌വെയറാണ്."
    ),
    bullets: L(
      ["Supports Windows only", "Works best with Adobe Photoshop CC", "Min 8GB RAM (16GB+ recommended)", "Intel i5 or higher processor"],
      ["Windows மட்டுமே ஆதரிக்கப்படும்", "Adobe Photoshop CC உடன் சிறப்பாக இயங்கும்", "குறைந்தது 8GB RAM (16GB+ பரிந்துரை)", "Intel i5 அல்லது அதற்கு மேல் processor"],
      ["केवल Windows समर्थित", "Adobe Photoshop CC के साथ बेहतरीन", "न्यूनतम 8GB RAM (16GB+ अनुशंसित)", "Intel i5 या उससे ऊपर प्रोसेसर"],
      ["Windows మాత్రమే మద్దతు", "Adobe Photoshop CC తో ఉత్తమంగా పని చేస్తుంది", "కనీసం 8GB RAM (16GB+ సిఫార్సు)", "Intel i5 లేదా అంతకంటే ఎక్కువ ప్రాసెసర్"],
      ["Windows ಮಾತ್ರ ಬೆಂಬಲ", "Adobe Photoshop CC ಯೊಂದಿಗೆ ಅತ್ಯುತ್ತಮ", "ಕನಿಷ್ಠ 8GB RAM (16GB+ ಶಿಫಾರಸು)", "Intel i5 ಅಥವಾ ಹೆಚ್ಚಿನ ಪ್ರೊಸೆಸರ್"],
      ["Windows മാത്രം പിന്തുണ", "Adobe Photoshop CC യുമായി മികച്ചത്", "കുറഞ്ഞത് 8GB RAM (16GB+ ശുപാർശ)", "Intel i5 അല്ലെങ്കിൽ അതിലുമേലുള്ള പ്രോസസർ"]
    ),
  },
  {
    id: "download",
    icon: "Download",
    title: T("Download & Setup", "பதிவிறக்கம் & அமைப்பு", "डाउनलोड और सेटअप", "డౌన్‌లోడ్ & సెటప్", "ಡೌನ್‌ಲೋಡ್ ಮತ್ತು ಸೆಟಪ್", "ഡൗൺലോഡും സജ്ജീകരണവും"),
    steps: L(
      ["You will receive a Google Drive link.", "Open the link and download all files.", "Save all files in a single folder."],
      ["Google Drive இணைப்பு வழங்கப்படும்.", "இணைப்பைத் திறந்து அனைத்து கோப்புகளையும் பதிவிறக்கவும்.", "அனைத்து கோப்புகளையும் ஒரே கோப்புறையில் சேமிக்கவும்."],
      ["आपको एक Google Drive लिंक मिलेगा।", "लिंक खोलें और सभी फ़ाइलें डाउनलोड करें।", "सभी फ़ाइलें एक फ़ोल्डर में रखें।"],
      ["మీకు Google Drive లింక్ అందుతుంది.", "లింక్ తెరిచి అన్ని ఫైళ్లను డౌన్‌లోడ్ చేయండి.", "అన్ని ఫైళ్లను ఒకే ఫోల్డర్‌లో సేవ్ చేయండి."],
      ["ನಿಮಗೆ Google Drive ಲಿಂಕ್ ಸಿಗುತ್ತದೆ.", "ಲಿಂಕ್ ತೆರೆದು ಎಲ್ಲಾ ಫೈಲ್‌ಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.", "ಎಲ್ಲಾ ಫೈಲ್‌ಗಳನ್ನು ಒಂದೇ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಇರಿಸಿ."],
      ["നിങ്ങൾക്ക് Google Drive ലിങ്ക് ലഭിക്കും.", "ലിങ്ക് തുറന്ന് എല്ലാ ഫയലുകളും ഡൗൺലോഡ് ചെയ്യുക.", "എല്ലാ ഫയലുകളും ഒരേ ഫോൾഡറിൽ സൂക്ഷിക്കുക."]
    ),
  },
  {
    id: "extract",
    icon: "FolderArchive",
    title: T("Extract Data", "தரவை பிரித்தெடுக்கவும்", "डेटा एक्सट्रैक्ट करें", "డేటా ఎక్స్‌ట్రాక్ట్ చేయండి", "ಡೇಟಾ ಎಕ್ಸ್‌ಟ್ರ್ಯಾಕ್ಟ್", "ഡാറ്റ എക്സ്ട്രാക്റ്റ്"),
    intro: T(
      "Locate “AlbumPlus 3 Data Part 1”. There will be multiple parts (Part 1, 2, 3, 4).",
      "“AlbumPlus 3 Data Part 1” ஐக் கண்டறியவும். பல பகுதிகள் இருக்கும் (Part 1, 2, 3, 4).",
      "“AlbumPlus 3 Data Part 1” खोजें। कई भाग होंगे (Part 1, 2, 3, 4)।",
      "“AlbumPlus 3 Data Part 1” ను గుర్తించండి. అనేక భాగాలు ఉంటాయి (Part 1, 2, 3, 4).",
      "“AlbumPlus 3 Data Part 1” ಅನ್ನು ಹುಡುಕಿ. ಬಹು ಭಾಗಗಳು ಇರುತ್ತವೆ (Part 1, 2, 3, 4).",
      "“AlbumPlus 3 Data Part 1” കണ്ടെത്തുക. ഒന്നിലധികം ഭാഗങ്ങൾ ഉണ്ടാകും (Part 1, 2, 3, 4)."
    ),
    steps: L(
      ["Download all parts", "Keep all files in one folder", "Extract ONLY Part 1"],
      ["எல்லா பகுதிகளையும் பதிவிறக்கவும்", "அனைத்து கோப்புகளையும் ஒரே கோப்புறையில் வைக்கவும்", "Part 1 மட்டுமே பிரித்தெடுக்கவும்"],
      ["सभी भाग डाउनलोड करें", "सभी फ़ाइलें एक फ़ोल्डर में रखें", "केवल Part 1 एक्सट्रैक्ट करें"],
      ["అన్ని భాగాలను డౌన్‌లోడ్ చేయండి", "అన్ని ఫైళ్లను ఒకే ఫోల్డర్‌లో ఉంచండి", "Part 1 ను మాత్రమే ఎక్స్‌ట్రాక్ట్ చేయండి"],
      ["ಎಲ್ಲಾ ಭಾಗಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "ಎಲ್ಲಾ ಫೈಲ್‌ಗಳನ್ನು ಒಂದೇ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಇರಿಸಿ", "ಕೇವಲ Part 1 ಅನ್ನು ಎಕ್ಸ್‌ಟ್ರ್ಯಾಕ್ಟ್ ಮಾಡಿ"],
      ["എല്ലാ ഭാഗങ്ങളും ഡൗൺലോഡ് ചെയ്യുക", "എല്ലാ ഫയലുകളും ഒരേ ഫോൾഡറിൽ സൂക്ഷിക്കുക", "Part 1 മാത്രം എക്സ്ട്രാക്റ്റ് ചെയ്യുക"]
    ),
    note: T(
      "Result: ~14GB of data will be extracted.",
      "முடிவு: ~14GB தரவு பிரித்தெடுக்கப்படும்.",
      "परिणाम: लगभग 14GB डेटा एक्सट्रैक्ट होगा।",
      "ఫలితం: ~14GB డేటా ఎక్స్‌ట్రాక్ట్ అవుతుంది.",
      "ಫಲಿತಾಂಶ: ~14GB ಡೇಟಾ ಎಕ್ಸ್‌ಟ್ರ್ಯಾಕ್ಟ್ ಆಗುತ್ತದೆ.",
      "ഫലം: ~14GB ഡാറ്റ എക്സ്ട്രാക്റ്റ് ചെയ്യപ്പെടും."
    ),
  },
  {
    id: "install",
    icon: "Settings",
    title: T("Installation", "நிறுவல்", "इंस्टॉलेशन", "ఇన్‌స్టాలేషన్", "ಸ್ಥಾಪನೆ", "ഇൻസ്റ്റാളേഷൻ"),
    intro: T(
      "After extraction you will find two installers: 32-bit (older Photoshop) and 64-bit (Photoshop CC).",
      "பிரித்தெடுத்த பிறகு இரண்டு installers இருக்கும்: 32-bit (பழைய Photoshop) மற்றும் 64-bit (Photoshop CC).",
      "एक्सट्रैक्ट के बाद दो इंस्टॉलर मिलेंगे: 32-bit (पुराना Photoshop) और 64-bit (Photoshop CC)।",
      "ఎక్స్‌ట్రాక్ట్ తర్వాత రెండు ఇన్‌స్టాలర్లు ఉంటాయి: 32-bit (పాత Photoshop) మరియు 64-bit (Photoshop CC).",
      "ಎಕ್ಸ್‌ಟ್ರ್ಯಾಕ್ಟ್ ನಂತರ ಎರಡು ಸ್ಥಾಪಕಗಳು ಇರುತ್ತವೆ: 32-bit (ಹಳೆಯ Photoshop) ಮತ್ತು 64-bit (Photoshop CC).",
      "എക്സ്ട്രാക്റ്റിന് ശേഷം രണ്ട് ഇൻസ്റ്റാളറുകൾ ഉണ്ടാകും: 32-bit (പഴയ Photoshop) ഉം 64-bit (Photoshop CC) ഉം."
    ),
    steps: L(
      ["Choose the correct version", "Double-click the installer", "Click Next → Install", "A desktop icon will be created"],
      ["சரியான பதிப்பை தேர்ந்தெடுக்கவும்", "Installer ஐ double-click செய்யவும்", "Next → Install ஐ கிளிக் செய்யவும்", "Desktop icon உருவாக்கப்படும்"],
      ["सही संस्करण चुनें", "इंस्टॉलर पर डबल-क्लिक करें", "Next → Install क्लिक करें", "डेस्कटॉप आइकॉन बनेगा"],
      ["సరైన వెర్షన్ ఎంచుకోండి", "ఇన్‌స్టాలర్‌పై డబుల్-క్లిక్ చేయండి", "Next → Install క్లిక్ చేయండి", "డెస్క్‌టాప్ ఐకాన్ సృష్టించబడుతుంది"],
      ["ಸರಿಯಾದ ಆವೃತ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", "ಇನ್‌ಸ್ಟಾಲರ್ ಡಬಲ್-ಕ್ಲಿಕ್ ಮಾಡಿ", "Next → Install ಕ್ಲಿಕ್ ಮಾಡಿ", "ಡೆಸ್ಕ್‌ಟಾಪ್ ಐಕಾನ್ ರಚನೆಯಾಗುತ್ತದೆ"],
      ["ശരിയായ പതിപ്പ് തിരഞ്ഞെടുക്കുക", "ഇൻസ്റ്റാളർ ഡബിൾ-ക്ലിക്ക് ചെയ്യുക", "Next → Install ക്ലിക്ക് ചെയ്യുക", "ഡെസ്ക്ടോപ്പ് ഐക്കൺ സൃഷ്ടിക്കപ്പെടും"]
    ),
  },
  {
    id: "first_open",
    icon: "PlayCircle",
    title: T("First Time Open", "முதல் முறை திறப்பு", "पहली बार खोलना", "మొదటిసారి తెరవడం", "ಮೊದಲ ಬಾರಿಗೆ ತೆರೆಯಿರಿ", "ആദ്യമായി തുറക്കൽ"),
    note: T(
      "Always open Adobe Photoshop FIRST, then open AlbumPlus. Otherwise an error will appear asking you to open Photoshop.",
      "முதலில் Adobe Photoshop ஐத் திறக்கவும், பிறகு AlbumPlus ஐத் திறக்கவும். இல்லையெனில் Photoshop ஐத் திறக்கச் சொல்லி பிழை வரும்.",
      "पहले Adobe Photoshop खोलें, फिर AlbumPlus। अन्यथा Photoshop खोलने का एरर आएगा।",
      "ముందుగా Adobe Photoshop తెరవండి, తరువాత AlbumPlus. లేకపోతే Photoshop తెరవమని ఎర్రర్ వస్తుంది.",
      "ಮೊದಲು Adobe Photoshop ತೆರೆಯಿರಿ, ನಂತರ AlbumPlus. ಇಲ್ಲದಿದ್ದರೆ Photoshop ತೆರೆಯಲು ಕೇಳುವ ದೋಷ ಬರುತ್ತದೆ.",
      "ആദ്യം Adobe Photoshop തുറക്കുക, പിന്നീട് AlbumPlus. അല്ലെങ്കിൽ Photoshop തുറക്കാൻ ആവശ്യപ്പെടുന്ന പിശക് വരും."
    ),
  },
  {
    id: "registration",
    icon: "UserPlus",
    title: T("Registration", "பதிவு", "रजिस्ट्रेशन", "నమోదు", "ನೋಂದಣಿ", "രജിസ്ട്രേഷൻ"),
    steps: L(
      ["Enter your mobile number", "Fill in Username, Studio Name and other details", "Click Register", "Inform support via WhatsApp or Email", "Admin will activate your account"],
      ["உங்கள் கைபேசி எண்ணை உள்ளிடவும்", "பயனர்பெயர், ஸ்டுடியோ பெயர் மற்றும் பிற விவரங்களை நிரப்பவும்", "Register ஐ கிளிக் செய்யவும்", "WhatsApp அல்லது Email மூலம் ஆதரவை அறிவிக்கவும்", "Admin உங்கள் கணக்கை செயல்படுத்துவார்"],
      ["अपना मोबाइल नंबर दर्ज करें", "Username, Studio Name और अन्य विवरण भरें", "Register पर क्लिक करें", "WhatsApp या Email से सपोर्ट को सूचित करें", "Admin आपका खाता सक्रिय करेगा"],
      ["మీ మొబైల్ నంబర్ నమోదు చేయండి", "Username, Studio Name మరియు ఇతర వివరాలను నింపండి", "Register క్లిక్ చేయండి", "WhatsApp లేదా Email ద్వారా మద్దతుకు తెలియజేయండి", "Admin మీ ఖాతాను సక్రియం చేస్తారు"],
      ["ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ", "Username, Studio Name ಮತ್ತು ಇತರ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ", "Register ಕ್ಲಿಕ್ ಮಾಡಿ", "WhatsApp ಅಥವಾ Email ಮೂಲಕ ಬೆಂಬಲಕ್ಕೆ ತಿಳಿಸಿ", "Admin ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುತ್ತಾರೆ"],
      ["നിങ്ങളുടെ മൊബൈൽ നമ്പർ നൽകുക", "Username, Studio Name എന്നിവയും മറ്റ് വിശദാംശങ്ങളും പൂരിപ്പിക്കുക", "Register ക്ലിക്ക് ചെയ്യുക", "WhatsApp അല്ലെങ്കിൽ Email വഴി സപ്പോർട്ടിനെ അറിയിക്കുക", "Admin നിങ്ങളുടെ അക്കൗണ്ട് സജീവമാക്കും"]
    ),
  },
  {
    id: "activation",
    icon: "ShieldCheck",
    title: T("Activation", "செயல்படுத்தல்", "एक्टिवेशन", "యాక్టివేషన్", "ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ", "ആക്ടിവേഷൻ"),
    intro: T(
      "Once admin activates your account, open the software again and it will work with Photoshop.",
      "Admin செயல்படுத்தியதும், மென்பொருளை மீண்டும் திறக்கவும் — Photoshop உடன் இயங்கும்.",
      "Admin द्वारा सक्रिय होने पर सॉफ़्टवेयर फिर से खोलें, यह Photoshop के साथ काम करेगा।",
      "Admin సక్రియం చేసిన తర్వాత సాఫ్ట్‌వేర్‌ను మళ్లీ తెరవండి — Photoshop తో పని చేస్తుంది.",
      "Admin ಸಕ್ರಿಯಗೊಳಿಸಿದ ನಂತರ ಸಾಫ್ಟ್‌ವೇರ್ ಅನ್ನು ಮತ್ತೆ ತೆರೆಯಿರಿ — Photoshop ನೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ.",
      "Admin സജീവമാക്കിയ ശേഷം സോഫ്റ്റ്‌വെയർ വീണ്ടും തുറക്കുക — Photoshop ഉമായി പ്രവർത്തിക്കും."
    ),
  },
  {
    id: "connection",
    icon: "Link2",
    title: T("Software Connection", "மென்பொருள் இணைப்பு", "सॉफ़्टवेयर कनेक्शन", "సాఫ్ట్‌వేర్ కనెక్షన్", "ಸಾಫ್ಟ್‌ವೇರ್ ಸಂಪರ್ಕ", "സോഫ്റ്റ്‌വെയർ കണക്ഷൻ"),
    steps: L(
      ["Click the Settings icon (right side)", "Photoshop and AlbumPlus will connect", "Both merge into a single workflow"],
      ["Settings icon ஐ கிளிக் செய்யவும் (வலது பக்கம்)", "Photoshop மற்றும் AlbumPlus இணைக்கப்படும்", "இரண்டும் ஒரே workflow ஆக இணைகின்றன"],
      ["Settings आइकॉन क्लिक करें (दाहिनी ओर)", "Photoshop और AlbumPlus कनेक्ट होंगे", "दोनों एक workflow में मर्ज होंगे"],
      ["Settings ఐకాన్ క్లిక్ చేయండి (కుడి వైపు)", "Photoshop మరియు AlbumPlus కనెక్ట్ అవుతాయి", "రెండూ ఒకే workflow గా మర్జ్ అవుతాయి"],
      ["Settings ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ (ಬಲ ಭಾಗ)", "Photoshop ಮತ್ತು AlbumPlus ಸಂಪರ್ಕ ಆಗುತ್ತದೆ", "ಎರಡೂ ಒಂದೇ workflow ನಲ್ಲಿ ವಿಲೀನವಾಗುತ್ತವೆ"],
      ["Settings ഐക്കൺ ക്ലിക്ക് ചെയ്യുക (വലത് വശം)", "Photoshop ഉം AlbumPlus ഉം കണക്ട് ആകും", "രണ്ടും ഒരേ workflow ആയി ലയിക്കും"]
    ),
  },
  {
    id: "project",
    icon: "FolderPlus",
    title: T("Project Creation", "திட்ட உருவாக்கம்", "प्रोजेक्ट निर्माण", "ప్రాజెక్ట్ సృష్టి", "ಪ್ರಾಜೆಕ್ಟ್ ರಚನೆ", "പ്രോജക്റ്റ് സൃഷ്ടി"),
    steps: L(
      ["Click “New Project”", "Enter project details", "Save the project", "Double-click the project to open it"],
      ["“New Project” ஐ கிளிக் செய்யவும்", "திட்ட விவரங்களை உள்ளிடவும்", "திட்டத்தை சேமிக்கவும்", "திறக்க double-click செய்யவும்"],
      ["“New Project” क्लिक करें", "प्रोजेक्ट विवरण दर्ज करें", "प्रोजेक्ट सेव करें", "खोलने के लिए डबल-क्लिक करें"],
      ["“New Project” క్లిక్ చేయండి", "ప్రాజెక్ట్ వివరాలను నమోదు చేయండి", "ప్రాజెక్ట్ సేవ్ చేయండి", "తెరవడానికి డబుల్-క్లిక్ చేయండి"],
      ["“New Project” ಕ್ಲಿಕ್ ಮಾಡಿ", "ಪ್ರಾಜೆಕ್ಟ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ", "ಪ್ರಾಜೆಕ್ಟ್ ಸೇವ್ ಮಾಡಿ", "ತೆರೆಯಲು ಡಬಲ್-ಕ್ಲಿಕ್ ಮಾಡಿ"],
      ["“New Project” ക്ലിക്ക് ചെയ്യുക", "പ്രോജക്റ്റ് വിശദാംശങ്ങൾ നൽകുക", "പ്രോജക്റ്റ് സേവ് ചെയ്യുക", "തുറക്കാൻ ഡബിൾ-ക്ലിക്ക് ചെയ്യുക"]
    ),
  },
  {
    id: "import",
    icon: "Upload",
    title: T("Import Data", "தரவை இறக்குமதி செய்", "डेटा इम्पोर्ट", "డేటా దిగుమతి", "ಡೇಟಾ ಆಮದು", "ഡാറ്റ ഇറക്കുമതി"),
    intro: T(
      "You can import Templates, Backgrounds, Masks and Effects.",
      "Templates, Backgrounds, Masks மற்றும் Effects ஐ இறக்குமதி செய்யலாம்.",
      "Templates, Backgrounds, Masks और Effects इम्पोर्ट किए जा सकते हैं।",
      "Templates, Backgrounds, Masks మరియు Effects ను దిగుమతి చేయవచ్చు.",
      "Templates, Backgrounds, Masks ಮತ್ತು Effects ಆಮದು ಮಾಡಬಹುದು.",
      "Templates, Backgrounds, Masks, Effects എന്നിവ ഇറക്കുമതി ചെയ്യാം."
    ),
    bullets: L(
      ["Drag & Drop files into the app", "Or use the “Add” button (right side)"],
      ["கோப்புகளை drag & drop செய்யவும்", "அல்லது “Add” button ஐ பயன்படுத்தவும் (வலது பக்கம்)"],
      ["फ़ाइलों को drag & drop करें", "या “Add” बटन का उपयोग करें (दाहिनी ओर)"],
      ["ఫైళ్లను drag & drop చేయండి", "లేదా “Add” బటన్ ఉపయోగించండి (కుడి వైపు)"],
      ["ಫೈಲ್‌ಗಳನ್ನು drag & drop ಮಾಡಿ", "ಅಥವಾ “Add” ಬಟನ್ ಬಳಸಿ (ಬಲ ಭಾಗ)"],
      ["ഫയലുകൾ drag & drop ചെയ്യുക", "അല്ലെങ്കിൽ “Add” ബട്ടൺ ഉപയോഗിക്കുക (വലത് വശം)"]
    ),
    note: T(
      "Always match the template size with your project size.",
      "Template அளவை project அளவுடன் எப்போதும் பொருத்தவும்.",
      "हमेशा template साइज़ को project साइज़ से मिलाएं।",
      "ఎల్లప్పుడూ template సైజ్‌ను project సైజ్‌తో సరిపోల్చండి.",
      "ಯಾವಾಗಲೂ template ಗಾತ್ರವನ್ನು project ಗಾತ್ರಕ್ಕೆ ಹೊಂದಿಸಿ.",
      "എപ്പോഴും template വലിപ്പം project വലിപ്പത്തോട് ഒത്തുചേർക്കുക."
    ),
  },
  {
    id: "photos",
    icon: "Image",
    title: T("Photo Management", "புகைப்பட மேலாண்மை", "फ़ोटो प्रबंधन", "ఫోటో నిర్వహణ", "ಫೋಟೋ ನಿರ್ವಹಣೆ", "ഫോട്ടോ മാനേജ്മെന്റ്"),
    bullets: L(
      ["Add photos directly from a folder", "Used photos auto-hide", "Use the Hide / Visible toggle as needed"],
      ["கோப்புறையில் இருந்து photos சேர்க்கவும்", "பயன்படுத்திய photos தானாக மறையும்", "Hide / Visible toggle ஐ பயன்படுத்தவும்"],
      ["फ़ोल्डर से सीधे photos जोड़ें", "इस्तेमाल की गई photos auto-hide होंगी", "Hide / Visible toggle का उपयोग करें"],
      ["ఫోల్డర్ నుండి నేరుగా ఫోటోలు జోడించండి", "ఉపయోగించిన ఫోటోలు ఆటో-హైడ్ అవుతాయి", "Hide / Visible టోగుల్ ఉపయోగించండి"],
      ["ಫೋಲ್ಡರ್‌ನಿಂದ ನೇರವಾಗಿ ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ", "ಬಳಸಿದ ಫೋಟೋಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮರೆಯಾಗುತ್ತವೆ", "Hide / Visible ಟಾಗಲ್ ಬಳಸಿ"],
      ["ഫോൾഡറിൽ നിന്ന് നേരിട്ട് ഫോട്ടോകൾ ചേർക്കുക", "ഉപയോഗിച്ച ഫോട്ടോകൾ സ്വയം മറയും", "Hide / Visible ടോഗിൾ ഉപയോഗിക്കുക"]
    ),
  },
  {
    id: "multicam",
    icon: "Camera",
    title: T("Multi Camera Feature", "Multi Camera அம்சம்", "मल्टी कैमरा फीचर", "మల్టీ కెమెరా ఫీచర్", "ಮಲ್ಟಿ ಕ್ಯಾಮೆರಾ ವೈಶಿಷ್ಟ್ಯ", "മൾട്ടി ക്യാമറ ഫീച്ചർ"),
    bullets: L(
      ["Import multiple camera folders", "Ideal for events like weddings"],
      ["பல camera folders ஐ இறக்குமதி செய்யவும்", "திருமணம் போன்ற நிகழ்வுகளுக்கு ஏற்றது"],
      ["कई camera folders इम्पोर्ट करें", "शादी जैसे इवेंट्स के लिए उत्तम"],
      ["అనేక camera folders దిగుమతి చేయండి", "వివాహాలు వంటి ఈవెంట్‌లకు అనువైనది"],
      ["ಬಹು camera folders ಆಮದು ಮಾಡಿ", "ಮದುವೆಯಂತಹ ಈವೆಂಟ್‌ಗಳಿಗೆ ಸೂಕ್ತ"],
      ["ഒന്നിലധികം camera folders ഇറക്കുമതി ചെയ്യുക", "വിവാഹം പോലുള്ള ഇവന്റുകൾക്ക് അനുയോജ്യം"]
    ),
  },
  {
    id: "design",
    icon: "Wand2",
    title: T("Design Methods", "வடிவமைப்பு முறைகள்", "डिज़ाइन के तरीके", "డిజైన్ పద్ధతులు", "ವಿನ್ಯಾಸ ವಿಧಾನಗಳು", "ഡിസൈൻ രീതികൾ"),
    intro: T(
      "AlbumPlus offers 3-4 powerful design methods.",
      "AlbumPlus 3-4 சக்திவாய்ந்த வடிவமைப்பு முறைகளை வழங்குகிறது.",
      "AlbumPlus 3-4 शक्तिशाली डिज़ाइन तरीके देता है।",
      "AlbumPlus 3-4 శక్తివంతమైన డిజైన్ పద్ధతులను అందిస్తుంది.",
      "AlbumPlus 3-4 ಶಕ್ತಿಶಾಲಿ ವಿನ್ಯಾಸ ವಿಧಾನಗಳನ್ನು ನೀಡುತ್ತದೆ.",
      "AlbumPlus 3-4 ശക്തമായ ഡിസൈൻ രീതികൾ വാഗ്ദാനം ചെയ്യുന്നു."
    ),
    bullets: L(
      ["Double-click a PSD → photos auto-place", "Select layers → Right click → Fill Object", "Auto-layout using a sample template", "Link a template folder for batch design"],
      ["PSD ஐ double-click → photos தானாக இடம்பெறும்", "Layers ஐ தேர்வு → Right click → Fill Object", "Sample template பயன்படுத்தி auto layout", "Template folder ஐ இணைக்கவும்"],
      ["PSD पर डबल-क्लिक → photos ऑटो-प्लेस", "Layers चुनें → Right click → Fill Object", "Sample template से ऑटो लेआउट", "Template folder लिंक करें"],
      ["PSD పై డబుల్-క్లిక్ → ఫోటోలు ఆటో-ప్లేస్", "Layers ఎంచుకోండి → Right click → Fill Object", "Sample template ద్వారా ఆటో లేఅవుట్", "Template folder లింక్ చేయండి"],
      ["PSD ಡಬಲ್-ಕ್ಲಿಕ್ → ಫೋಟೋಗಳು ಸ್ವಯಂ-ಸ್ಥಾಪಿತ", "Layers ಆಯ್ಕೆಮಾಡಿ → Right click → Fill Object", "Sample template ಮೂಲಕ ಆಟೋ ಲೇಔಟ್", "Template folder ಲಿಂಕ್ ಮಾಡಿ"],
      ["PSD ഡബിൾ-ക്ലിക്ക് → ഫോട്ടോകൾ ഓട്ടോ-പ്ലേസ്", "Layers തിരഞ്ഞെടുക്കുക → Right click → Fill Object", "Sample template ഉപയോഗിച്ച് ഓട്ടോ ലേഔട്ട്", "Template folder ലിങ്ക് ചെയ്യുക"]
    ),
  },
  {
    id: "features",
    icon: "Sparkles",
    title: T("Key Features", "முக்கிய அம்சங்கள்", "मुख्य फीचर्स", "ముఖ్య ఫీచర్లు", "ಮುಖ್ಯ ವೈಶಿಷ್ಟ್ಯಗಳು", "പ്രധാന ഫീച്ചറുകൾ"),
    bullets: L(
      ["Auto album design", "Oil painting effects", "Background removal", "Multi-camera support", "Smart layout system"],
      ["தானியங்கி ஆல்பம் வடிவமைப்பு", "Oil painting effects", "Background removal", "Multi-camera ஆதரவு", "Smart layout system"],
      ["ऑटो एल्बम डिज़ाइन", "ऑयल पेंटिंग इफ़ेक्ट्स", "बैकग्राउंड रिमूवल", "मल्टी-कैमरा सपोर्ट", "स्मार्ट लेआउट सिस्टम"],
      ["ఆటో ఆల్బమ్ డిజైన్", "ఆయిల్ పెయింటింగ్ ఎఫెక్ట్స్", "బ్యాక్‌గ్రౌండ్ తొలగింపు", "మల్టీ-కెమెరా మద్దతు", "స్మార్ట్ లేఅవుట్ సిస్టమ్"],
      ["ಆಟೋ ಆಲ್ಬಮ್ ವಿನ್ಯಾಸ", "ಆಯಿಲ್ ಪೇಂಟಿಂಗ್ ಎಫೆಕ್ಟ್‌ಗಳು", "ಬ್ಯಾಕ್‌ಗ್ರೌಂಡ್ ತೆಗೆಯುವಿಕೆ", "ಮಲ್ಟಿ-ಕ್ಯಾಮೆರಾ ಬೆಂಬಲ", "ಸ್ಮಾರ್ಟ್ ಲೇಔಟ್ ವ್ಯವಸ್ಥೆ"],
      ["ഓട്ടോ ആൽബം ഡിസൈൻ", "ഓയിൽ പെയിന്റിംഗ് ഇഫക്റ്റുകൾ", "ബാക്ക്‌ഗ്രൗണ്ട് നീക്കം ചെയ്യൽ", "മൾട്ടി-ക്യാമറ പിന്തുണ", "സ്മാർട്ട് ലേഔട്ട് സിസ്റ്റം"]
    ),
  },
  {
    id: "support",
    icon: "LifeBuoy",
    title: T("Support", "ஆதரவு", "सहायता", "మద్దతు", "ಬೆಂಬಲ", "സപ്പോർട്ട്"),
    intro: T(
      "For activation or any help, contact us via WhatsApp or Email. Our support team typically replies within working hours.",
      "செயல்படுத்தல் அல்லது ஏதேனும் உதவிக்கு, WhatsApp அல்லது Email மூலம் எங்களைத் தொடர்புகொள்ளவும். வேலை நேரத்தில் பதிலளிப்போம்.",
      "एक्टिवेशन या सहायता के लिए WhatsApp या Email से संपर्क करें। हम कार्य समय में जवाब देते हैं।",
      "యాక్టివేషన్ లేదా సహాయం కోసం WhatsApp లేదా Email ద్వారా సంప్రదించండి. మేము పని గంటల్లో సమాధానం ఇస్తాము.",
      "ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ WhatsApp ಅಥವಾ Email ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ. ನಾವು ಕೆಲಸದ ಸಮಯದಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತೇವೆ.",
      "ആക്ടിവേഷനോ സഹായത്തിനോ WhatsApp അല്ലെങ്കിൽ Email വഴി ബന്ധപ്പെടുക. ജോലി സമയത്ത് ഞങ്ങൾ മറുപടി നൽകും."
    ),
  },
];
