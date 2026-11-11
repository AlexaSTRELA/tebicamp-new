#!/usr/bin/env python3
"""Build the public TeBiCamp catalog and mirror its public photos on tebicamp.ru.

Only published catalog rows are exported. All private/admin endpoints are excluded.
"""
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://gtbaelazxrapzdkygbsh.supabase.co"
PUBLIC_KEY = "sb_publishable_wt8VJ9ulkSNHQipnSwBwAw_dSChivV3"
STORAGE_PREFIX = "/storage/v1/object/public/catalog-photos/"
ALLOWED = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
FILE = re.compile(r"^[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp|avif)$", re.I)
MAX_IMAGE = 11 * 1024 * 1024


def request_bytes(url, headers=None):
    error = None
    for attempt in range(4):
        try:
            req = Request(url, headers={"User-Agent": "TeBiCamp-public-catalog/1.0", **(headers or {})})
            with urlopen(req, timeout=35) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"HTTP {resp.status}")
                expected = resp.headers.get("Content-Length")
                content = resp.read(MAX_IMAGE + 1) if STORAGE_PREFIX in url else resp.read()
                if len(content) > MAX_IMAGE and STORAGE_PREFIX in url:
                    raise RuntimeError("Photo too large")
                if expected and len(content) != int(expected):
                    raise RuntimeError(f"Incomplete response: {len(content)} / {expected} bytes")
                return content
        except Exception as exc:
            error = exc
            print(f"Request failed (attempt {attempt+1}/4): {urlsplit(url).path}: {exc}", flush=True)
            if attempt < 3:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Unable to fetch {urlsplit(url).path}: {error}")


def valid_image(data, ext):
    if ext in ("jpg", "jpeg"):
        return data.startswith(b"\xff\xd8\xff") and data.rstrip(b"\x00").endswith(b"\xff\xd9")
    if ext == "png":
        return data.startswith(b"\x89PNG\r\n\x1a\n") and b"IEND" in data[-24:]
    if ext == "webp":
        return data.startswith(b"RIFF") and data[8:12] == b"WEBP" and int.from_bytes(data[4:8], "little") + 8 == len(data)
    if ext == "avif":
        return len(data) > 16 and data[4:8] == b"ftyp"
    return False


def mirror_photo(url, slug, cache):
    if not isinstance(url, str) or not url:
        return url
    parsed = urlsplit(url)
    if parsed.hostname != "gtbaelazxrapzdkygbsh.supabase.co" or not parsed.path.startswith(STORAGE_PREFIX):
        return url  # Existing local assets remain untouched.
    path = unquote(parsed.path[len(STORAGE_PREFIX):])
    parts = path.split("/")
    if len(parts) != 2 or not ALLOWED.fullmatch(parts[0]) or not FILE.fullmatch(parts[1]):
        raise RuntimeError("Unexpected public photo path for " + slug)
    relative = "assets/catalog/" + slug + "/" + parts[1]
    if url in cache:
        return cache[url]
    dest = ROOT / relative
    ext = parts[1].rsplit(".", 1)[-1].lower()
    if not dest.exists() or not valid_image(dest.read_bytes(), ext):
        data = request_bytes(url)
        if not valid_image(data, ext):
            raise RuntimeError("Image data incomplete or corrupt: " + relative)
        dest.parent.mkdir(parents=True, exist_ok=True)
        temp = dest.with_suffix(dest.suffix + ".tmp")
        temp.write_bytes(data)
        temp.replace(dest)
        print(f"Mirrored {relative}: {len(data)} bytes", flush=True)
    cache[url] = relative
    return relative


def main():
    url = BASE + "/rest/v1/catalog_items?select=*&is_published=eq.true&status=in.(available,in_transit,sold)&order=display_order.asc,created_at.desc"
    rows = json.loads(request_bytes(url, {"apikey": PUBLIC_KEY, "Accept": "application/json"}))
    if not isinstance(rows, list):
        raise RuntimeError("Expected an array of public catalog rows")
    cache = {}
    count = 0
    for row in rows:
        slug = row.get("slug", "")
        if not ALLOWED.fullmatch(slug):
            raise RuntimeError("Invalid catalog slug")
        for field in ("cover_url", "home_cover_url"):
            row[field] = mirror_photo(row.get(field), slug, cache)
        photos = row.get("photos") or []
        if not isinstance(photos, list):
            raise RuntimeError("Unexpected photo list")
        for photo in photos:
            if isinstance(photo, dict):
                for field in ("url", "thumb"):
                    if field in photo:
                        photo[field] = mirror_photo(photo[field], slug, cache)
            elif isinstance(photo, str):
                photos[photos.index(photo)] = mirror_photo(photo, slug, cache)
            else:
                raise RuntimeError("Unexpected photo format")
        count += len(photos)
    result = "/* Generated from public Supabase rows; photos served from tebicamp.ru. */\nwindow.TEBICAMP_CATALOG_DATA = " + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "catalog-data.js").write_text(result, encoding="utf-8")
    print(f"Published {len(rows)} caravans, {count} photo entries, {len(cache)} mirrored remote photo URLs", flush=True)


if __name__ == "__main__":
    main()
