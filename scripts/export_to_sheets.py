#!/usr/bin/env python3
"""
Export all normalized Zionism 2000 dashboard data to Google Sheets.

Usage:
    python3 scripts/export_to_sheets.py

Requires:
    - credentials.json (Google service account key) in the dashboard/ folder
    - pip install gspread pandas openpyxl
"""

import json
import os
import sys
import gspread
from gspread.utils import ValueInputOption
from pathlib import Path

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR.parent / "Raw Material"
CREDS_PATH = RAW_DIR / "zionismdashboard-3984a62a7be3.json"
PLANTS_JSON = BASE_DIR / "src" / "data" / "plants.json"

XLSX_BITUACH = RAW_DIR / "דווח מפורט לביטוח לאומי על פירוט סדנאות לפי מפעלים ועלות מרץ- נובמבר 2025 (version 1).xlsb.xlsx"
XLSX_JOINT = RAW_DIR / "דוח לשרי להגשה למכרז לגוינט.xlsx"

SHEET_TITLE = "ציונות 2000 — דאטה מנורמל"

# If you already created a sheet manually, put its URL or ID here.
# The service account email must have editor access to this sheet.
# Leave empty to create a new sheet (requires Drive storage quota).
EXISTING_SHEET_URL = "https://docs.google.com/spreadsheets/d/1-5SCucco-T0ECvW7GDSrdnKm0LzBVXJaBpwajmfxZFU/edit"

# ──────────────────────────────────────────────
# Additional data from XLSX files (extracted)
# ──────────────────────────────────────────────

# Employee counts and names from the Bituach Leumi report (צפון sheet)
FACTORY_EXTRA = {
    "אלכם": {"employees": 500, "ceo_name": "יגאל כהן (גולי)", "hr_name": "תמר ויצמן"},
    "גלקון": {"employees": 114, "ceo_name": "ערן גרבינר", "hr_name": "יערה גרינשפאן"},
    "נעלי נאות": {"employees": 300, "ceo_name": "משה מרי", "hr_name": "ענת אללי"},
    "שמיר  אופטיקה": {"employees": 200, "ceo_name": "יגן משה", "hr_name": "ימית יוליס"},
    "שמיר אופטיקה": {"employees": 200, "ceo_name": "יגן משה", "hr_name": "ימית יוליס"},
    "בנטל": {"employees": 110, "ceo_name": "", "hr_name": "לירון"},
    "קפרו": {"employees": 65, "ceo_name": "אריאל ברין דולינקו", "hr_name": "מילי ווסרשטרום"},
    "מגן אקואנרג'י": {"employees": 80, "ceo_name": "מיכאל ססלר", "hr_name": "גליה קפלן אגמי"},
    "נטפים צפון": {"employees": 105, "ceo_name": "", "hr_name": ""},
    "להבות": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "דנפל": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "פסקל": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "חוליות שדה": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "נעם אורים": {"employees": 0, "ceo_name": "", "hr_name": ""},
    # Pilots (south) — no employee data in XLSX
    "ארז": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "כפרית": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "פולג": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "ישראביג": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "דפוס בארי": {"employees": 0, "ceo_name": "", "hr_name": ""},
    "פולירון": {"employees": 0, "ceo_name": "", "hr_name": ""},
}

# Pilot factory employee counts from Joint tender table
PILOT_EMPLOYEES = {
    "ארז": 85,
    "כפרית": 200,
    "פולג": 80,
    "ישראביג": 20,
    "דפוס בארי": 400,
    "פולירון": 100,
}

# Merge pilot employee counts
for name, emp in PILOT_EMPLOYEES.items():
    if name in FACTORY_EXTRA:
        FACTORY_EXTRA[name]["employees"] = emp

def employee_group(count):
    """Convert exact employee count to a size group."""
    if count <= 0:
        return ""
    elif count <= 100:
        return "0-100"
    elif count <= 400:
        return "100-400"
    else:
        return "400-1000"


# Program phases summary (from Joint tender טבלה מרכזת sheet)
PHASES = [
    {
        "phase": "שלב 1: פתוח הידע והרתימה",
        "description": "מפגשי חשיפה ושיווק למנכ\"לים, פיתוח ידע לסמנכ\"לי מש\"א",
        "factories": "~36 מפעלים (צפון + דרום)",
        "ceos": 68,
        "hr_managers": 40,
        "hr_workshops": 10,
        "mgmt_participants": 0,
        "mgmt_workshops": 0,
        "mid_participants": 0,
        "mid_workshops": 0,
        "worker_participants": 0,
        "worker_workshops": 0,
    },
    {
        "phase": "שלב 2: פיילוטים",
        "description": "6 מפעלים באזור עוטף עזה וחוף אשקלון",
        "factories": "ארז, כפרית, פולג, ישראביג, דפוס בארי, פולירון",
        "ceos": 6,
        "hr_managers": 6,
        "hr_workshops": 15,
        "mgmt_participants": 95,
        "mgmt_workshops": 17,
        "mid_participants": 95,
        "mid_workshops": 20,
        "worker_participants": 380,
        "worker_workshops": 49,
    },
    {
        "phase": "שלב 3: הכשרת מנהלי מש\"א",
        "description": "קורסים ייעודיים למנהלי משאבי אנוש — דרום (6) וצפון (9)",
        "factories": "15 מנהלי מש\"א",
        "ceos": 0,
        "hr_managers": 15,
        "hr_workshops": 38,
        "mgmt_participants": 0,
        "mgmt_workshops": 0,
        "mid_participants": 0,
        "mid_workshops": 0,
        "worker_participants": 0,
        "worker_workshops": 0,
    },
    {
        "phase": "שלב 4: תכנית מפעלית",
        "description": "13 מפעלים — צפון, גולן, גליל מערבי ועוטף עזה",
        "factories": "בנטל, מגן, גלקון, שמיר, קפרו, אלכם, נטפים, להבות, דנפל, נעלי נאות, פסקל, חוליות שדה, נעם אורים",
        "ceos": 13,
        "hr_managers": 27,
        "hr_workshops": 0,
        "mgmt_participants": 200,
        "mgmt_workshops": 41,
        "mid_participants": 209,
        "mid_workshops": 27,
        "worker_participants": 409,
        "worker_workshops": 0,
    },
]


def get_client():
    """Authenticate with Google Sheets API."""
    if not CREDS_PATH.exists():
        print(f"ERROR: credentials.json not found at {CREDS_PATH}")
        print("Please set up Google Cloud service account and download the key file.")
        sys.exit(1)
    return gspread.service_account(filename=str(CREDS_PATH))


def load_plants():
    """Load plants.json data."""
    with open(PLANTS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def create_plants_tab(sh, data):
    """Tab 1: מפעלים — all 19 plants with merged XLSX data."""
    ws = sh.sheet1
    ws.update_title("מפעלים")

    headers = [
        "שם מפעל", "קיבוץ", "ענף", "אזור", "שלב", "סוג פעילות",
        "תקופת פעילות", "חודש התחלה", "שנת התחלה", "חודש סיום", "שנת סיום",
        "גודל מפעל", "שם מנכ\"ל", "שם מנהל/ת מש\"א",
        "מנכ\"לים", "מנהלי מש\"א", "סדנאות מש\"א",
        "משתתפי הנהלה", "סדנאות הנהלה",
        "משתתפי מנהלים ביניים", "סדנאות מנהלים ביניים",
        "משתתפי עובדים", "סדנאות עובדים",
        "סה\"כ משתתפים", "סה\"כ סדנאות",
        "תיאור"
    ]

    rows = [headers]
    for p in data["plants"]:
        name = p["name"]
        extra = FACTORY_EXTRA.get(name, {"employees": 0, "ceo_name": "", "hr_name": ""})
        emp = extra["employees"]
        size_group = employee_group(emp)

        rows.append([
            name,
            p["kibbutz"],
            p["sector"],
            p["geography"],
            p["stage"],
            p["activityType"],
            p["activityMonthsRaw"],
            p["activityPeriod"]["startMonth"],
            p["activityPeriod"]["startYear"],
            p["activityPeriod"]["endMonth"],
            p["activityPeriod"]["endYear"],
            size_group,
            extra["ceo_name"],
            extra["hr_name"],
            p["ceoCount"],
            p["hrManagerCount"],
            p["hrManagerSessions"],
            p["mgmtParticipants"],
            p["mgmtSessions"],
            p["midMgmtParticipants"],
            p["midMgmtSessions"],
            p["workerParticipants"],
            p["workerSessions"],
            p["totalParticipants"],
            p["totalSessions"],
            p.get("description", ""),
        ])

    ws.update("A1", rows, value_input_option=ValueInputOption.user_entered)

    # Format: bold headers, freeze row
    ws.format("A1:AA1", {
        "textFormat": {"bold": True},
        "backgroundColor": {"red": 0.85, "green": 0.92, "blue": 1.0},
    })
    ws.freeze(rows=1)
    print(f"  ✓ מפעלים — {len(rows)-1} rows")


def create_timeline_tab(sh, data):
    """Tab 2: ציר זמן — monthly session data."""
    ws = sh.add_worksheet(title="ציר זמן", rows=30, cols=6)

    headers = ["חודש", "הנהלה", "מנהלים ביניים", "עובדים", "סה\"כ"]
    rows = [headers]

    # Sort timeline months chronologically
    timeline = data["timeline"]
    sorted_months = sorted(timeline.keys())

    for month in sorted_months:
        d = timeline[month]
        total = round(d["mgmt"] + d["midMgmt"] + d["workers"], 2)
        rows.append([month, d["mgmt"], d["midMgmt"], d["workers"], total])

    ws.update("A1", rows, value_input_option=ValueInputOption.user_entered)
    ws.format("A1:E1", {
        "textFormat": {"bold": True},
        "backgroundColor": {"red": 0.85, "green": 0.92, "blue": 1.0},
    })
    ws.freeze(rows=1)
    print(f"  ✓ ציר זמן — {len(rows)-1} rows")


def create_summary_tab(sh, data):
    """Tab 3: סיכום — key metrics."""
    ws = sh.add_worksheet(title="סיכום כללי", rows=20, cols=3)

    plants = data["plants"]
    total_participants = sum(p["totalParticipants"] for p in plants)
    total_sessions = sum(p["totalSessions"] for p in plants)
    total_ceos = sum(p["ceoCount"] for p in plants)
    total_hr = sum(p["hrManagerCount"] for p in plants)
    total_mgmt = sum(p["mgmtParticipants"] for p in plants)
    total_mid = sum(p["midMgmtParticipants"] for p in plants)
    total_workers = sum(p["workerParticipants"] for p in plants)
    pilots = [p for p in plants if p["stage"] == "פיילוט"]
    active = [p for p in plants if p["stage"] == "תכנית פעילה"]

    # Count layers per plant
    three_layers = sum(1 for p in plants if p["mgmtParticipants"] > 0 and p["midMgmtParticipants"] > 0 and p["workerParticipants"] > 0)

    rows = [
        ["מדד", "ערך", "הערות"],
        ["סה\"כ מפעלים", len(plants), ""],
        ["מפעלי פיילוט", len(pilots), ""],
        ["מפעלי תכנית פעילה", len(active), ""],
        ["סה\"כ משתתפים", total_participants, ""],
        ["סה\"כ סדנאות", total_sessions, ""],
        ["מנכ\"לים שהשתתפו (במפעלים)", total_ceos, "מתוך הדאטה — 1 לכל מפעל"],
        ["מנכ\"לים שנחשפו (כלל התכנית)", 68, "כולל מפגשי חשיפה ושיווק"],
        ["מנהלי מש\"א (במפעלים)", total_hr, ""],
        ["מנהלי מש\"א (כלל התכנית)", 88, "כולל קורסי הכשרה"],
        ["משתתפי הנהלה", total_mgmt, f"{round(total_mgmt/total_participants*100)}% מכלל המשתתפים"],
        ["משתתפי מנהלים ביניים", total_mid, f"{round(total_mid/total_participants*100)}% מכלל המשתתפים"],
        ["משתתפי עובדים", total_workers, f"{round(total_workers/total_participants*100)}% מכלל המשתתפים"],
        ["ממוצע משתתפים למפעל", round(total_participants / len(plants), 1), ""],
        ["ממוצע סדנאות למפעל", round(total_sessions / len(plants), 1), ""],
        ["מפעלים עם 3 שכבות", three_layers, f"{round(three_layers/len(plants)*100)}%"],
        ["אזורים גיאוגרפיים", 5, "עוטף עזה, חוף אשקלון, גליל עליון, רמת הגולן, גליל מערבי"],
        ["ענפים תעשייתיים", 6, "פלסטיק וגומי, מתכת ומכונות, דפוס, פארמה, חשמל, טקסטיל"],
        ["תקופת תכנית", "דצמבר 2023 — נובמבר 2025", "כ-24 חודשים"],
    ]

    ws.update("A1", rows, value_input_option=ValueInputOption.user_entered)
    ws.format("A1:C1", {
        "textFormat": {"bold": True},
        "backgroundColor": {"red": 0.85, "green": 0.92, "blue": 1.0},
    })
    ws.freeze(rows=1)
    print(f"  ✓ סיכום כללי — {len(rows)-1} rows")


def create_phases_tab(sh):
    """Tab 4: שלבי התכנית — program phase breakdown."""
    ws = sh.add_worksheet(title="שלבי התכנית", rows=10, cols=12)

    headers = [
        "שלב", "תיאור", "מפעלים / משתתפים",
        "מנכ\"לים", "מנהלי מש\"א", "סדנאות מש\"א",
        "משתתפי הנהלה", "סדנאות הנהלה",
        "משתתפי מנהלים", "סדנאות מנהלים",
        "משתתפי עובדים", "סדנאות עובדים"
    ]

    rows = [headers]
    for phase in PHASES:
        rows.append([
            phase["phase"],
            phase["description"],
            phase["factories"],
            phase["ceos"],
            phase["hr_managers"],
            phase["hr_workshops"],
            phase["mgmt_participants"],
            phase["mgmt_workshops"],
            phase["mid_participants"],
            phase["mid_workshops"],
            phase["worker_participants"],
            phase["worker_workshops"],
        ])

    ws.update("A1", rows, value_input_option=ValueInputOption.user_entered)
    ws.format("A1:L1", {
        "textFormat": {"bold": True},
        "backgroundColor": {"red": 0.85, "green": 0.92, "blue": 1.0},
    })
    ws.freeze(rows=1)
    print(f"  ✓ שלבי התכנית — {len(rows)-1} rows")


def set_rtl(sh):
    """Set all sheets to RTL."""
    body = {
        "requests": [
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": ws.id,
                        "rightToLeft": True,
                    },
                    "fields": "rightToLeft",
                }
            }
            for ws in sh.worksheets()
        ]
    }
    sh.batch_update(body)
    print("  ✓ RTL set on all sheets")


def main():
    print("Loading data...")
    data = load_plants()

    print("Authenticating with Google Sheets...")
    gc = get_client()

    if EXISTING_SHEET_URL:
        print(f"Opening existing sheet...")
        sh = gc.open_by_url(EXISTING_SHEET_URL)
        # Clear all existing worksheets except the first
        for ws in sh.worksheets()[1:]:
            sh.del_worksheet(ws)
        sh.sheet1.clear()
    else:
        print(f"Creating sheet: '{SHEET_TITLE}'...")
        sh = gc.create(SHEET_TITLE)
        # Share with Ori's email
        print("Sharing sheet...")
        sh.share("oristeinitz@gmail.com", perm_type="user", role="writer")

    print("Populating tabs...")
    create_plants_tab(sh, data)
    create_timeline_tab(sh, data)
    create_summary_tab(sh, data)
    create_phases_tab(sh)

    print("Setting RTL...")
    set_rtl(sh)

    print(f"\n{'='*60}")
    print(f"Google Sheet created successfully!")
    print(f"URL: {sh.url}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
