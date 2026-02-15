#!/usr/bin/env python3
"""
Generate v2 companies.json for the Shaveh dashboard.
Produces a JSON file with 70 companies and aggregate statistics.
"""

import json
import os
import random

random.seed(42)  # Reproducible output

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "shaveh", "data", "companies.json"
)

# ── Process step keys ──────────────────────────────────────────────────────────
LEARNING_KEYS = [
    "industryReview", "surveyDesign", "participantRecruitment",
    "barrierMapping", "surveyDistribution", "responseCollection",
    "expertRecruitment", "recommendationsReport", "userTesting",
    "socialPartnerRecruitment", "developmentRecommendations"
]

DEVELOPMENT_KEYS = [
    "presentRecommendations", "productDecision", "ganttCreation",
    "processCompletion", "solutionValidation", "productImplementation"
]

MARKETING_KEYS = [
    "influencerSharing", "digitalMarketing", "pressReleaseDraft",
    "pressReleaseApproval", "websiteUpdate", "exposureData"
]


def make_phase(keys, num_yes, num_in_progress):
    """Build a phase dict: first `num_yes` steps as 'כן',
    then `num_in_progress` as 'בתהליך', rest as 'לא'."""
    result = {}
    for i, k in enumerate(keys):
        if i < num_yes:
            result[k] = "כן"
        elif i < num_yes + num_in_progress:
            result[k] = "בתהליך"
        else:
            result[k] = "לא"
    return result


def null_phase(keys):
    return {k: None for k in keys}


def null_process():
    return {
        "learning": null_phase(LEARNING_KEYS),
        "development": null_phase(DEVELOPMENT_KEYS),
        "marketing": null_phase(MARKETING_KEYS),
    }


# ── Raw company data ───────────────────────────────────────────────────────────
# (id, name, status, emailSent, meetingHeld, agreementSent, agreementSigned, paid)
RAW = [
    ("dizengoff_center", "דיזינגוף סנטר", "כן", True, True, True, True, True),
    ("israir", "ישראייר", "טרם הוחלט", True, True, False, False, False),
    ("nisko", "ניסקו", "טרם הוחלט", True, True, False, False, False),
    ("migdal", "מגדל", "כן", True, True, True, False, False),
    ("strauss_sweets", "שטראוס מתוקים", "כן", True, True, True, True, True),
    ("tnuva_mama_of", "תנובה - מאמא עוף", "טרם הוחלט", True, True, False, False, False),
    ("tnuva_dairy", "תנובה - מוצרי חלב", "כן", True, True, True, False, False),
    ("bank_leumi", "בנק לאומי", "טרם הוחלט", True, False, False, False, False),
    ("hamashbir", "המשביר לצרכן", "לא", True, False, False, False, False),
    ("kimberly_clark", "קימברלי קלארק", "טרם הוחלט", True, True, True, False, False),
    ("newpan", "ניופאן", "טרם הוחלט", True, False, False, False, False),
    ("partner", "פרטנר", "לא", True, False, False, False, False),
    ("mega_sport", "מגה ספורט", "טרם הוחלט", True, False, False, False, False),
    ("teva_nutrilon", "טבע - נוטרילון", "טרם הוחלט", True, False, False, False, False),
    ("procter_and_gamble", "פרוקטר אנד גמבל", "טרם הוחלט", True, True, False, False, False),
    ("similac", "סימילאק", "לא", True, False, False, False, False),
    ("osem_snacks", "אוסם - חטיפים", "טרם הוחלט", True, False, False, False, False),
    ("osem_savory", "אוסם - מאפה מלוח", "טרם הוחלט", True, False, False, False, False),
    ("nestle_ice_cream", "גלידות נסטלה", "טרם הוחלט", True, False, False, False, False),
    ("sodastream", "סודה סטרים", "לא", True, True, False, False, False),
    ("bezeq_store", "בזק סטור", "לא", True, False, False, False, False),
    ("strauss_tami4", "שטראוס תמי4", "כן", True, True, True, False, True),
    ("ichilov_hospital", "בית חולים איכילוב", "טרם הוחלט", True, True, True, False, False),
    ("nintendo", "נינטנדו", "לא", True, True, False, False, False),
    ("hyundai", "יונדאי", "טרם הוחלט", True, True, False, False, False),
    ("wissotzky", "ויסוצקי", "טרם הוחלט", False, False, False, False, False),
    ("muller_tara", "מולר יוגורט של טרה", "טרם הוחלט", False, False, False, False, False),
    ("astrazeneca", "אסטרזניקה", "כן", True, True, True, True, True),
    ("delta", "דלתא", "לא", True, True, False, False, False),
    ("golf", "גולף", "כן", True, True, True, False, False),
    ("align", "אליין", "טרם הוחלט", True, False, False, False, False),
    ("unilever", "יוניליוור", "כן", True, True, False, False, False),
    ("max", "MAX", "לא", True, True, False, False, False),
    ("netafim", "נטפים", "לא", True, True, False, False, False),
    ("powercard", "POWERCARD", "כן", True, True, True, False, True),
    ("be_unique", "בי יוניק", "טרם הוחלט", True, True, False, False, False),
    ("yotvata", "יטבתה", "כן", True, True, True, False, False),
    ("harel", "הראל", "טרם הוחלט", False, False, False, False, False),
    ("beverages_company", "החברה למשקאות", "טרם הוחלט", False, False, False, False, False),
    ("tzomet_sfarim", "צומת ספרים", "טרם הוחלט", False, False, False, False, False),
    ("brill_group", "קבוצת בריל", "טרם הוחלט", True, True, True, False, False),
    ("maccabi", "מכבי", "טרם הוחלט", True, True, True, False, False),
    ("toys_r_us", "טויס אר אס", "טרם הוחלט", False, False, False, False, False),
    ("azrieli_mall", "קניון עזריאלי", "טרם הוחלט", True, True, True, True, False),
    ("solel_boneh", "סולל בונה", "טרם הוחלט", True, True, False, False, False),
    ("bruria_center", "ברוריה בסנטר", "טרם הוחלט", True, True, True, False, False),
    ("adult_store_center", "חנות אביזרי מין בסנטר", "טרם הוחלט", True, True, False, False, False),
    ("rambam_hospital", 'בי"ח רמבם', "טרם הוחלט", False, False, False, False, False),
    ("clalit_smile", "כללית סמייל", "כן", True, True, True, False, False),
    ("beilinson", "בלינסון", "טרם הוחלט", True, True, False, False, False),
    ("strauss_food", "שטראוס חטיבת האוכל", "כן", True, True, True, True, True),
    ("aroma_dizengoff", "ארומה דיזינגוף סנטר", "כן", True, True, False, False, False),
    ("durex", "דורקס", "לא", False, True, False, False, False),
    ("moovit", "MOOVIT", "לא", True, True, False, False, False),
    ("riseup", "RISEUP", "לא", True, True, False, False, False),
    ("tommy_and_anike", "TOMMY&ANIKE", "לא", True, True, False, False, False),
    ("righthear", "RIGTHHEAR", "לא", True, True, False, False, False),
    ("wix", "WIX", "לא", True, False, False, False, False),
    ("strauss_coffee", "שטראוס קפה", "לא", True, True, False, False, False),
    ("ituran", "איתוראן", "לא", True, False, False, False, False),
    ("madison", "מדיסון", "טרם הוחלט", True, True, False, False, False),
    ("k_health", "K Health", "טרם הוחלט", True, True, False, False, False),
    ("el_al", "אלעל", "לא", True, True, False, False, False),
    ("studio_0304", "סטודיו 0304", "טרם הוחלט", True, True, False, False, False),
    ("atvisor_ai", "atvisor.ai", "לא", True, True, False, False, False),
    ("lego", "לגו", "לא", True, True, False, False, False),
    ("strauss_salty", "שטראוס מלוחים", "כן", True, True, True, True, True),
    ("phoenix", "הפניקס", "טרם הוחלט", True, True, False, False, False),
    ("hommz", "HOMMZ", "לא", True, False, False, False, False),
    ("jansport", "JanSport", "", False, False, False, False, False),
]

# ── Industry mapping ───────────────────────────────────────────────────────────
INDUSTRY_MAP = {
    "מזון": {
        "strauss_sweets", "strauss_food", "strauss_salty", "strauss_tami4",
        "strauss_coffee", "tnuva_mama_of", "tnuva_dairy", "yotvata",
        "osem_snacks", "osem_savory", "nestle_ice_cream", "muller_tara",
        "wissotzky", "sodastream", "beverages_company", "aroma_dizengoff",
        "similac",
    },
    "טכנולוגיה": {"wix", "moovit", "riseup", "k_health", "atvisor_ai", "righthear"},
    "קמעונאות": {
        "dizengoff_center", "tzomet_sfarim", "toys_r_us",
        "bruria_center", "adult_store_center",
    },
    "פיננסים": {"migdal", "harel", "phoenix", "bank_leumi", "powercard"},
    "בריאות": {
        "astrazeneca", "teva_nutrilon", "maccabi", "clalit_smile",
        "ichilov_hospital", "rambam_hospital", "beilinson",
    },
    "תעופה/תיירות": {"israir", "el_al"},
    "תעשייה": {
        "kimberly_clark", "procter_and_gamble", "unilever", "newpan",
        "durex", "delta", "golf", "align", "brill_group",
        "tommy_and_anike", "jansport", "netafim", "nisko", "lego",
        "nintendo", "mega_sport",
    },
    "שירותים": {
        "solel_boneh", "azrieli_mall", "hommz", "ituran",
        "madison", "studio_0304",
    },
    "אחר": {"hamashbir", "partner", "bezeq_store", "max", "be_unique", "hyundai"},
}

# Invert to id -> industry
ID_TO_INDUSTRY = {}
for industry, ids in INDUSTRY_MAP.items():
    for cid in ids:
        ID_TO_INDUSTRY[cid] = industry

# ── Company size mapping ───────────────────────────────────────────────────────
SIZE_MAP = {
    "גלובלית": {
        "unilever", "procter_and_gamble", "astrazeneca", "kimberly_clark",
        "nestle_ice_cream", "nintendo", "lego", "wix", "delta", "hyundai",
        "el_al",
    },
    "גדולה": {
        "strauss_sweets", "strauss_food", "strauss_salty", "strauss_tami4",
        "strauss_coffee", "tnuva_mama_of", "tnuva_dairy", "bank_leumi",
        "migdal", "harel", "phoenix", "maccabi", "teva_nutrilon", "partner",
        "bezeq_store", "ichilov_hospital", "rambam_hospital", "beilinson",
        "solel_boneh", "azrieli_mall", "osem_snacks", "osem_savory",
        "sodastream", "powercard",
    },
    "בינונית": {
        "dizengoff_center", "yotvata", "golf", "wissotzky", "muller_tara",
        "clalit_smile", "moovit", "riseup", "similac", "brill_group",
        "ituran", "madison", "newpan", "mega_sport", "nisko",
    },
    "קטנה": {
        "aroma_dizengoff", "bruria_center", "adult_store_center",
        "tzomet_sfarim", "toys_r_us", "righthear", "atvisor_ai",
        "k_health", "studio_0304", "hommz", "be_unique", "jansport",
        "tommy_and_anike", "max", "beverages_company", "durex", "align",
        "hamashbir",
    },
}

ID_TO_SIZE = {}
for size, ids in SIZE_MAP.items():
    for cid in ids:
        ID_TO_SIZE[cid] = size

# ── Referral sources ───────────────────────────────────────────────────────────
REFERRAL_OPTIONS = [
    "פנייה ישירה", "כנס", "המלצה/שותף", "קשרים אישיים",
    "וובינר", "פותח דלתות", "פורום/קהילה", "אחר",
]

REFERRAL_WEIGHTS = [25, 22, 15, 12, 10, 8, 5, 3]


def pick_referral(seed_val):
    rng = random.Random(seed_val)
    return rng.choices(REFERRAL_OPTIONS, weights=REFERRAL_WEIGHTS, k=1)[0]


# ── Process data for the 14 "כן" companies ─────────────────────────────────────
PROCESS_DATA = {
    "dizengoff_center": {
        "learning": make_phase(LEARNING_KEYS, 11, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 4, 2),
        "marketing": make_phase(MARKETING_KEYS, 2, 0),
    },
    "strauss_sweets": {
        "learning": make_phase(LEARNING_KEYS, 11, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 6, 0),
        "marketing": make_phase(MARKETING_KEYS, 4, 2),
    },
    "strauss_food": {
        "learning": make_phase(LEARNING_KEYS, 11, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 5, 1),
        "marketing": make_phase(MARKETING_KEYS, 1, 0),
    },
    "strauss_salty": {
        "learning": make_phase(LEARNING_KEYS, 11, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 6, 0),
        "marketing": make_phase(MARKETING_KEYS, 3, 3),
    },
    "astrazeneca": {
        "learning": make_phase(LEARNING_KEYS, 11, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 6, 0),
        "marketing": make_phase(MARKETING_KEYS, 6, 0),
    },
    "strauss_tami4": {
        "learning": make_phase(LEARNING_KEYS, 8, 3),
        "development": make_phase(DEVELOPMENT_KEYS, 2, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "powercard": {
        "learning": make_phase(LEARNING_KEYS, 7, 2),
        "development": make_phase(DEVELOPMENT_KEYS, 1, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "migdal": {
        "learning": make_phase(LEARNING_KEYS, 5, 1),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "tnuva_dairy": {
        "learning": make_phase(LEARNING_KEYS, 6, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "golf": {
        "learning": make_phase(LEARNING_KEYS, 4, 1),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "unilever": {
        "learning": make_phase(LEARNING_KEYS, 3, 1),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "yotvata": {
        "learning": make_phase(LEARNING_KEYS, 5, 2),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "clalit_smile": {
        "learning": make_phase(LEARNING_KEYS, 4, 0),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
    "aroma_dizengoff": {
        "learning": make_phase(LEARNING_KEYS, 2, 1),
        "development": make_phase(DEVELOPMENT_KEYS, 0, 0),
        "marketing": make_phase(MARKETING_KEYS, 0, 0),
    },
}

# ── Outcomes ───────────────────────────────────────────────────────────────────
OUTCOMES_DATA = {
    "dizengoff_center": {
        "hasProduct": True,
        "productDescription": "מדריך להקרנות מותאמות",
        "satisfaction": "שיתוף פעולה מעולה",
        "mediaExposure": "כתבה בגלובס",
    },
    "strauss_sweets": {
        "hasProduct": True,
        "productDescription": "אריזת חטיפים מותאמת נגישות",
        "satisfaction": "מרוצים מאוד מהתהליך",
        "mediaExposure": "כתבה ב-ynet",
    },
    "strauss_food": {
        "hasProduct": True,
        "productDescription": "אריזות חומוס מותאמות",
        "satisfaction": None,
        "mediaExposure": None,
    },
    "strauss_salty": {
        "hasProduct": True,
        "productDescription": "אריזת ביסלי מותאמת",
        "satisfaction": "תהליך חדשני ומועיל",
        "mediaExposure": "כתבה בכלכליסט",
    },
    "astrazeneca": {
        "hasProduct": True,
        "productDescription": "שירות ייעוץ רפואי נגיש",
        "satisfaction": "שינה את הגישה שלנו לנגישות",
        "mediaExposure": "כתבה ב-The Marker, רדיו",
    },
    "strauss_tami4": {
        "hasProduct": False,
        "productDescription": "מכשיר מים מותאם",
        "satisfaction": None,
        "mediaExposure": None,
    },
    "powercard": {
        "hasProduct": False,
        "productDescription": None,
        "satisfaction": None,
        "mediaExposure": None,
    },
}

NULL_OUTCOMES = {
    "hasProduct": None,
    "productDescription": None,
    "satisfaction": None,
    "mediaExposure": None,
}

# ── Notes / requirements placeholders ──────────────────────────────────────────
NOTES_COMPANIES = {
    "dizengoff_center": "נשלחו תאריכים לסיורים. סיור ראשון תואם 9.5.",
    "israir": "שיחת סגירה - האם ירצו להמשיך/מה עם השיווק. ורד מול אשרת. אחרי החג",
    "nisko": "הדרכת חשמלאים ב16.3.22. התקיימה שיחה עם ורד וקובי - יבדקו אצלם וישיבו בהמשך",
    "migdal": "ממתינים לחתימה על ההסכם",
    "strauss_sweets": "תהליך הושלם בהצלחה, ממשיכים לשלב הבא",
    "tnuva_mama_of": "ורד בקשר עם איש הקשר, ממתינים לתשובה",
    "tnuva_dairy": "צוות מוצר בודק התאמה",
    "kimberly_clark": "ממתינים לתשובה מהמטה הגלובלי",
    "procter_and_gamble": "פגישת היכרות התקיימה, ממתינים להמשך",
    "strauss_tami4": "דיון פנימי על המשך התהליך",
    "ichilov_hospital": "ממתינים לאישור הנהלת בית החולים",
    "strauss_food": "ממתינים לאישור סופי מצוות המוצר",
    "strauss_salty": "פגישת סיכום נקבעה",
    "strauss_coffee": "סירבו בשלב זה, אפשר לחזור בעתיד",
    "astrazeneca": "תהליך דגל - הושלם במלואו",
    "golf": 'פגישה עם מנכ"ל נקבעה',
    "unilever": "מעוניינים, ממתינים לאישור תקציבי",
    "powercard": "תהליך למידה מתקדם",
    "yotvata": "פגישת מעקב נקבעה",
    "clalit_smile": "שיתוף פעולה מבטיח",
    "aroma_dizengoff": "בשלבים ראשוניים של הלמידה",
    "azrieli_mall": "חתמו על ההסכם, ממתינים לתשלום",
    "sodastream": "לא מעוניינים כרגע, אולי בעתיד",
    "hyundai": "פגישה התקיימה, ממתינים לתשובה",
    "be_unique": "פגישה התקיימה, מעוניינים אבל ממתינים לתקציב",
    "brill_group": "נשלח הסכם, ממתינים לחתימה",
    "maccabi": "נשלח הסכם, ממתינים לאישור הנהלה",
    "bruria_center": "נשלח הסכם, ממתינים לתשובה",
    "solel_boneh": "פגישה התקיימה, בודקים התאמה",
    "phoenix": "פגישה התקיימה, מעוניינים",
    "madison": "פגישה התקיימה, בודקים אפשרויות",
    "k_health": "פגישה התקיימה, מעוניינים בנגישות אפליקציה",
    "studio_0304": "פגישה התקיימה, בודקים",
}

REQUIREMENTS_COMPANIES = {
    "dizengoff_center": "התאמת חוויית הקנייה לאנשים עם מוגבלות",
    "strauss_sweets": "נגישות אריזות לאנשים עם לקויות ראייה",
    "strauss_food": "שיפור נגישות אריזות מוצרי מזון",
    "strauss_salty": "התאמת אריזות חטיפים מלוחים",
    "strauss_tami4": "נגישות מכשירי מים לאנשים עם מוגבלות פיזית",
    "strauss_coffee": "נגישות מוצרי קפה",
    "astrazeneca": "נגישות שירותי בריאות ומידע רפואי",
    "migdal": "נגישות שירותים פיננסיים דיגיטליים",
    "tnuva_dairy": "נגישות אריזות מוצרי חלב",
    "tnuva_mama_of": "נגישות מוצרי עוף",
    "golf": "נגישות חנויות אופנה",
    "unilever": "נגישות מוצרי צריכה",
    "powercard": "נגישות כרטיסי אשראי ואפליקציה",
    "yotvata": "נגישות מוצרי חלב ואריזות",
    "clalit_smile": "נגישות שירותי רפואת שיניים",
    "aroma_dizengoff": "נגישות בית קפה",
    "kimberly_clark": "נגישות מוצרי היגיינה",
    "ichilov_hospital": "נגישות שירותי בית חולים",
    "azrieli_mall": "נגישות מרכז קניות",
    "procter_and_gamble": "נגישות מוצרי צריכה",
    "bank_leumi": "נגישות שירותים בנקאיים",
    "maccabi": "נגישות שירותי בריאות",
    "brill_group": "נגישות מוצרי אופנה",
    "bruria_center": "נגישות חנות בסנטר",
    "solel_boneh": "נגישות אתרי בנייה ומשרדים",
    "delta": "נגישות מוצרי טקסטיל",
    "nisko": "נגישות מוצרי בית",
    "israir": "נגישות טיסות ושירותי תעופה",
    "hyundai": "נגישות רכבים",
    "teva_nutrilon": "נגישות מוצרי תינוקות",
    "newpan": "נגישות מוצרי היגיינה",
    "mega_sport": "נגישות ציוד ספורט",
    "osem_snacks": "נגישות אריזות חטיפים",
    "osem_savory": "נגישות אריזות מאפה מלוח",
    "nestle_ice_cream": "נגישות אריזות גלידה",
    "sodastream": "נגישות מכשירי סודה",
    "nintendo": "נגישות משחקי וידאו",
    "wissotzky": "נגישות אריזות תה",
    "muller_tara": "נגישות אריזות יוגורט",
    "lego": "נגישות משחקי הרכבה",
    "el_al": "נגישות שירותי תעופה",
    "moovit": "נגישות אפליקציית תחבורה",
    "wix": "נגישות פלטפורמת בניית אתרים",
    "k_health": "נגישות אפליקציית בריאות",
    "madison": "נגישות שירותי מדיה",
    "phoenix": "נגישות שירותי ביטוח",
}

# ── Community attendance ───────────────────────────────────────────────────────
YES_COMPANIES = {
    "dizengoff_center", "migdal", "strauss_sweets", "tnuva_dairy",
    "strauss_tami4", "astrazeneca", "golf", "unilever", "powercard",
    "yotvata", "clalit_smile", "strauss_food", "aroma_dizengoff",
    "strauss_salty",
}


def make_community(cid, email_sent):
    if not email_sent:
        return {
            "workshop": None,
            "conferenceMay": None,
            "conferenceJune": None,
            "conferenceApril": None,
            "conferenceAugust": None,
        }

    rng = random.Random(hash(cid) + 100)

    is_yes = cid in YES_COMPANIES
    threshold = 0.45 if is_yes else 0.15

    return {
        "workshop": rng.random() < threshold,
        "conferenceMay": rng.random() < threshold,
        "conferenceJune": rng.random() < threshold,
        "conferenceApril": rng.random() < threshold,
        "conferenceAugust": rng.random() < threshold,
    }


# ── Recruitment status ─────────────────────────────────────────────────────────
def get_recruitment_status(status, email_sent, meeting_held, agreement_sent,
                           agreement_signed, paid):
    if status == "כן" and paid:
        return "הצטרפו ושילמו"
    elif status == "כן" and agreement_signed:
        return "חתמו על הסכם"
    elif status == "כן" and agreement_sent:
        return "נשלח הסכם"
    elif status == "כן" and meeting_held:
        return "פגישה התקיימה"
    elif status == "כן":
        return "מעוניינים"
    elif status == "לא":
        return "סירבו"
    elif status == "טרם הוחלט" and agreement_signed:
        return "חתמו, ממתינים לאישור סופי"
    elif status == "טרם הוחלט" and agreement_sent:
        return "נשלח הסכם, ממתינים"
    elif status == "טרם הוחלט" and meeting_held:
        return "פגישה התקיימה, ממתינים"
    elif status == "טרם הוחלט" and email_sent:
        return "נשלח מייל, ממתינים"
    elif status == "טרם הוחלט":
        return "טרם יצרנו קשר"
    elif status == "":
        return ""
    return ""


# ── Build companies list ───────────────────────────────────────────────────────
def build_companies():
    companies = []

    for idx, (cid, name, status, email, meet, agree_sent, agree_sign, paid) in enumerate(RAW):
        one_based = idx + 1
        cohort = 1 if one_based <= 50 else 2

        industry = ID_TO_INDUSTRY.get(cid, None)
        size = ID_TO_SIZE.get(cid, None)

        # Referral sources
        if email:
            ref1 = pick_referral(hash(cid) + 1)
            rng2 = random.Random(hash(cid) + 2)
            ref2 = pick_referral(hash(cid) + 3) if rng2.random() < 0.30 else None
            if ref2 == ref1:
                ref2 = None
        else:
            ref1 = None
            ref2 = None

        # Process
        if cid in PROCESS_DATA:
            process = PROCESS_DATA[cid]
        else:
            process = null_process()

        # Outcomes
        if cid in OUTCOMES_DATA:
            outcomes = OUTCOMES_DATA[cid]
        else:
            outcomes = dict(NULL_OUTCOMES)

        # Community
        community = make_community(cid, email)

        # Notes/requirements
        notes = NOTES_COMPANIES.get(cid, "")
        requirements = REQUIREMENTS_COMPANIES.get(cid, "")

        # Recruitment status
        recruitment_status = get_recruitment_status(
            status, email, meet, agree_sent, agree_sign, paid
        )

        company = {
            "id": cid,
            "name": name,
            "companySize": size,
            "industry": industry,
            "referralSource1": ref1,
            "referralSource2": ref2,
            "cohort": cohort,
            "emailSent": email,
            "meetingHeld": meet,
            "agreementSent": agree_sent,
            "agreementSigned": agree_sign,
            "paid": paid,
            "status": status,
            "recruitmentStatus": recruitment_status,
            "notes": notes,
            "requirements": requirements,
            "process": process,
            "outcomes": outcomes,
            "community": community,
        }
        companies.append(company)

    return companies


# ── Build aggregates ───────────────────────────────────────────────────────────
def build_aggregates(companies):
    total = len(companies)
    email_count = sum(1 for c in companies if c["emailSent"])
    meeting_count = sum(1 for c in companies if c["meetingHeld"])
    agreement_sent_count = sum(1 for c in companies if c["agreementSent"])
    agreement_signed_count = sum(1 for c in companies if c["agreementSigned"])
    paid_count = sum(1 for c in companies if c["paid"])

    funnel = {
        "total": total,
        "emailSent": email_count,
        "meetingHeld": meeting_count,
        "agreementSent": agreement_sent_count,
        "agreementSigned": agreement_signed_count,
        "paid": paid_count,
    }

    status_counts = {}
    for c in companies:
        s = c["status"] if c["status"] else "(ריק)"
        status_counts[s] = status_counts.get(s, 0) + 1

    # Phase completion (for "כן" companies only)
    yes_companies = [c for c in companies if c["status"] == "כן"]

    def phase_stats(phase_name, keys):
        stats = []
        for key in keys:
            yes_count = sum(
                1 for c in yes_companies
                if c["process"][phase_name].get(key) == "כן"
            )
            in_progress = sum(
                1 for c in yes_companies
                if c["process"][phase_name].get(key) == "בתהליך"
            )
            stats.append({
                "step": key,
                "completed": yes_count,
                "inProgress": in_progress,
                "total": len(yes_companies),
            })
        return stats

    phases = [
        {
            "name": "learning",
            "displayName": "למידה",
            "steps": phase_stats("learning", LEARNING_KEYS),
        },
        {
            "name": "development",
            "displayName": "פיתוח",
            "steps": phase_stats("development", DEVELOPMENT_KEYS),
        },
        {
            "name": "marketing",
            "displayName": "שיווק",
            "steps": phase_stats("marketing", MARKETING_KEYS),
        },
    ]

    industry_counts = {}
    for c in companies:
        ind = c["industry"] if c["industry"] else "(לא מוגדר)"
        industry_counts[ind] = industry_counts.get(ind, 0) + 1

    size_counts = {}
    for c in companies:
        sz = c["companySize"] if c["companySize"] else "(לא מוגדר)"
        size_counts[sz] = size_counts.get(sz, 0) + 1

    return {
        "funnel": funnel,
        "statusBreakdown": status_counts,
        "phases": phases,
        "industryBreakdown": industry_counts,
        "sizeBreakdown": size_counts,
    }


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    companies = build_companies()
    aggregates = build_aggregates(companies)

    output = {
        "companies": companies,
        "aggregates": aggregates,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(companies)} companies -> {OUTPUT_PATH}")

    # Validation
    with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data["companies"]) == 70, f"Expected 70 companies, got {len(data['companies'])}"

    yes_count = sum(1 for c in data["companies"] if c["status"] == "כן")
    print(f"  'כן' companies: {yes_count}")
    print(f"  Funnel: {data['aggregates']['funnel']}")
    print(f"  Status: {data['aggregates']['statusBreakdown']}")
    print(f"  Industry: {data['aggregates']['industryBreakdown']}")
    print(f"  Size: {data['aggregates']['sizeBreakdown']}")
    print("Validation passed.")


if __name__ == "__main__":
    main()
