#!/usr/bin/env python3
"""
Fetch logo candidates for all 70 companies.
Sources: Google Favicon (128px), DuckDuckGo Instant Answer icon, direct website icon.
Also tries Brandfetch-style icon URLs.
Generates a manifest for the admin page.
"""

import json
import os
import urllib.parse
import urllib.request
import ssl
import sys
import re

# Allow unverified HTTPS for APIs
ssl._create_default_https_context = ssl._create_unverified_context

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPANIES_PATH = os.path.join(BASE_DIR, "src", "shaveh", "data", "companies.json")
CANDIDATES_DIR = os.path.join(BASE_DIR, "public", "logos", "candidates")
MANIFEST_DIR = os.path.join(BASE_DIR, "src", "admin", "data")
MANIFEST_PATH = os.path.join(MANIFEST_DIR, "logo_candidates.json")

# ── Domain map: company_id → website domain ────────────────────────────────────
DOMAIN_MAP = {
    # קמעונאות
    "dizengoff_center": "dizengoffcenter.co.il",
    "tzomet_sfarim": "booknet.co.il",
    "toys_r_us": "toysrus.co.il",
    "bruria_center": None,
    "adult_store_center": None,

    # מזון
    "strauss_sweets": "strauss-group.com",
    "strauss_food": "strauss-group.com",
    "strauss_salty": "strauss-group.com",
    "strauss_tami4": "tami4.co.il",
    "strauss_coffee": "strauss-group.com",
    "tnuva_mama_of": "tnuva.co.il",
    "tnuva_dairy": "tnuva.co.il",
    "yotvata": "yotvata.co.il",
    "osem_snacks": "osem.co.il",
    "osem_savory": "osem.co.il",
    "nestle_ice_cream": "nestle.co.il",
    "muller_tara": "tara.co.il",
    "wissotzky": "wissotzky.com",
    "sodastream": "sodastream.com",
    "beverages_company": None,
    "aroma_dizengoff": "aroma.co.il",
    "similac": "similac.com",

    # טכנולוגיה
    "wix": "wix.com",
    "moovit": "moovit.com",
    "riseup": "riseup.co.il",
    "k_health": "khealth.com",
    "atvisor_ai": "atvisor.ai",
    "righthear": "right-hear.com",

    # פיננסים
    "migdal": "migdal.co.il",
    "harel": "harel-group.co.il",
    "phoenix": "fnx.co.il",
    "bank_leumi": "leumi.co.il",
    "powercard": "powercard.co.il",

    # בריאות
    "astrazeneca": "astrazeneca.com",
    "teva_nutrilon": "teva.co.il",
    "maccabi": "maccabi4u.co.il",
    "clalit_smile": "clalit-smile.co.il",
    "ichilov_hospital": "tasmc.org.il",
    "rambam_hospital": "rambam.org.il",
    "beilinson": "rabin.org.il",

    # תעופה/תיירות
    "israir": "israirairlines.com",
    "el_al": "elal.com",

    # תעשייה
    "kimberly_clark": "kimberly-clark.com",
    "procter_and_gamble": "pg.com",
    "unilever": "unilever.com",
    "newpan": "newpan.co.il",
    "durex": "durex.co.il",
    "delta": "deltagalil.com",
    "golf": "golf.co.il",
    "align": "aligntech.com",
    "brill_group": "brill.co.il",
    "tommy_and_anike": None,
    "jansport": "jansport.com",
    "netafim": "netafim.com",
    "nisko": "nisko.co.il",
    "lego": "lego.com",
    "nintendo": "nintendo.com",
    "mega_sport": "megasport.co.il",

    # שירותים
    "solel_boneh": "solel-boneh.co.il",
    "azrieli_mall": "azrieli.com",
    "hommz": "hommz.co.il",
    "ituran": "ituran.com",
    "madison": "madison.co.il",
    "studio_0304": None,

    # אחר
    "hamashbir": "hamashbir.co.il",
    "partner": "partner.co.il",
    "bezeq_store": "bezeq.co.il",
    "max": "max.co.il",
    "be_unique": None,
    "hyundai": "hyundai.co.il",
}

# English brand names for companies (used for DuckDuckGo and icon APIs)
ENGLISH_NAMES = {
    "dizengoff_center": "Dizengoff Center",
    "tzomet_sfarim": "Tzomet Sfarim bookstore Israel",
    "toys_r_us": "Toys R Us",
    "strauss_sweets": "Strauss Group",
    "strauss_food": "Strauss Group",
    "strauss_salty": "Strauss Group",
    "strauss_tami4": "Tami4",
    "strauss_coffee": "Strauss Coffee",
    "tnuva_mama_of": "Tnuva",
    "tnuva_dairy": "Tnuva",
    "yotvata": "Yotvata dairy Israel",
    "osem_snacks": "Osem",
    "osem_savory": "Osem",
    "nestle_ice_cream": "Nestle",
    "muller_tara": "Tara dairy Israel",
    "wissotzky": "Wissotzky Tea",
    "sodastream": "SodaStream",
    "aroma_dizengoff": "Aroma Espresso Bar",
    "similac": "Similac Abbott",
    "wix": "Wix",
    "moovit": "Moovit",
    "riseup": "RiseUp Israel fintech",
    "k_health": "K Health",
    "atvisor_ai": "Atvisor AI",
    "righthear": "RightHear",
    "migdal": "Migdal Insurance Israel",
    "harel": "Harel Insurance Israel",
    "phoenix": "Phoenix Insurance Israel",
    "bank_leumi": "Bank Leumi",
    "powercard": "Powercard Israel",
    "astrazeneca": "AstraZeneca",
    "teva_nutrilon": "Teva Pharmaceutical",
    "maccabi": "Maccabi Healthcare",
    "clalit_smile": "Clalit Health Services",
    "ichilov_hospital": "Ichilov Hospital Tel Aviv",
    "rambam_hospital": "Rambam Hospital Haifa",
    "beilinson": "Beilinson Hospital",
    "israir": "Israir Airlines",
    "el_al": "El Al Airlines",
    "kimberly_clark": "Kimberly Clark",
    "procter_and_gamble": "Procter and Gamble",
    "unilever": "Unilever",
    "newpan": "Newpan Israel",
    "durex": "Durex",
    "delta": "Delta Galil",
    "golf": "Golf Israel fashion",
    "align": "Align Technology Invisalign",
    "brill_group": "Brill Group Israel",
    "jansport": "JanSport",
    "netafim": "Netafim",
    "nisko": "Nisco Industries Israel",
    "lego": "LEGO",
    "nintendo": "Nintendo",
    "mega_sport": "Mega Sport Israel",
    "solel_boneh": "Solel Boneh",
    "azrieli_mall": "Azrieli Group",
    "hommz": "Hommz",
    "ituran": "Ituran",
    "madison": "Madison Group Israel",
    "hamashbir": "Hamashbir Lazarchan",
    "partner": "Partner Communications Israel",
    "bezeq_store": "Bezeq Telecom Israel",
    "max": "Max credit card Israel",
    "hyundai": "Hyundai",
}


def fetch_image(url, save_path, min_bytes=100):
    """Download an image from URL. Returns True if successful."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = resp.read()
                if len(data) > min_bytes:
                    with open(save_path, "wb") as f:
                        f.write(data)
                    return True
        return False
    except Exception:
        return False


def try_duckduckgo_icon(english_name, save_path):
    """Try DuckDuckGo instant answer API to get an icon."""
    try:
        query = urllib.parse.quote(f"{english_name}")
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_redirect=1"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            icon_url = data.get("Image", "")
            if icon_url and icon_url.startswith("http"):
                return fetch_image(icon_url, save_path)
    except Exception:
        pass
    return False


def try_website_apple_touch_icon(domain, save_path):
    """Try fetching /apple-touch-icon.png from the website."""
    url = f"https://{domain}/apple-touch-icon.png"
    return fetch_image(url, save_path, min_bytes=500)


def try_website_favicon_ico(domain, save_path):
    """Try fetching /favicon.ico from the website."""
    url = f"https://{domain}/favicon.ico"
    return fetch_image(url, save_path, min_bytes=500)


def main():
    with open(COMPANIES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    companies = data["companies"]

    os.makedirs(MANIFEST_DIR, exist_ok=True)

    manifest = {}
    stats = {"favicon_ok": 0, "duckduckgo_ok": 0, "apple_touch_ok": 0, "no_domain": 0, "total_candidates": 0}

    for i, company in enumerate(companies):
        cid = company["id"]
        name = company["name"]
        domain = DOMAIN_MAP.get(cid)
        en_name = ENGLISH_NAMES.get(cid, "")

        company_dir = os.path.join(CANDIDATES_DIR, cid)
        os.makedirs(company_dir, exist_ok=True)

        candidates = []
        google_query = urllib.parse.quote(f"{name} logo לוגו")
        google_url = f"https://www.google.com/search?q={google_query}&tbm=isch"

        print(f"  [{i+1}/{len(companies)}] {cid}:", end="")

        if domain:
            # Source 1: Google Favicon API (128px)
            favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            favicon_path = os.path.join(company_dir, "favicon.png")
            if not os.path.exists(favicon_path) or os.path.getsize(favicon_path) < 100:
                ok = fetch_image(favicon_url, favicon_path)
            else:
                ok = True  # Already fetched
            if ok and os.path.exists(favicon_path) and os.path.getsize(favicon_path) > 100:
                candidates.append({"filename": "favicon.png", "source": "google-favicon"})
                stats["favicon_ok"] += 1
                print(" favicon✓", end="")

            # Source 2: Apple Touch Icon from website
            apple_path = os.path.join(company_dir, "apple-touch.png")
            if not os.path.exists(apple_path) or os.path.getsize(apple_path) < 500:
                ok2 = try_website_apple_touch_icon(domain, apple_path)
            else:
                ok2 = True
            if ok2 and os.path.exists(apple_path) and os.path.getsize(apple_path) > 500:
                candidates.append({"filename": "apple-touch.png", "source": "apple-touch-icon"})
                stats["apple_touch_ok"] += 1
                print(" apple✓", end="")

        else:
            stats["no_domain"] += 1
            print(" no-domain", end="")

        # Source 3: DuckDuckGo Instant Answer icon (works with or without domain)
        if en_name:
            ddg_path = os.path.join(company_dir, "duckduckgo.png")
            if not os.path.exists(ddg_path) or os.path.getsize(ddg_path) < 100:
                ok3 = try_duckduckgo_icon(en_name, ddg_path)
            else:
                ok3 = True
            if ok3 and os.path.exists(ddg_path) and os.path.getsize(ddg_path) > 100:
                candidates.append({"filename": "duckduckgo.png", "source": "duckduckgo"})
                stats["duckduckgo_ok"] += 1
                print(" ddg✓", end="")

        stats["total_candidates"] += len(candidates)
        print(f"  ({len(candidates)} candidates)")

        manifest[cid] = {
            "name": name,
            "domain": domain,
            "candidates": candidates,
            "googleSearchUrl": google_url,
        }

    # Write manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # Summary
    total = len(companies)
    has_any = sum(1 for v in manifest.values() if v["candidates"])
    print(f"\n{'='*50}")
    print(f"Logo candidates fetched!")
    print(f"  Companies with candidates: {has_any}/{total}")
    print(f"  Total candidates:          {stats['total_candidates']}")
    print(f"  Google favicons:           {stats['favicon_ok']}")
    print(f"  Apple touch icons:         {stats['apple_touch_ok']}")
    print(f"  DuckDuckGo icons:          {stats['duckduckgo_ok']}")
    print(f"  No domain mapped:          {stats['no_domain']}")
    print(f"  Manifest:                  {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
