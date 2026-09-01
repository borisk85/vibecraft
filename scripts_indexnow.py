# -*- coding: utf-8 -*-
"""Подача URL сайта в IndexNow (Яндекс и Bing). Google IndexNow не поддерживает."""
import json, re, sys, urllib.request
KEY = sys.argv[1]
HOST = "vibecraft.kz"
req0 = urllib.request.Request("https://vibecraft.kz/sitemap.xml", headers={"User-Agent": "Mozilla/5.0"})
sm = urllib.request.urlopen(req0, timeout=60).read().decode()
urls = re.findall(r"<loc>(.*?)</loc>", sm)
urls = [u for u in urls if u.startswith("https://vibecraft.kz")]
body = {"host": HOST, "key": KEY, "keyLocation": "https://%s/%s.txt" % (HOST, KEY), "urlList": urls}
for ep in ("https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"):
    req = urllib.request.Request(ep, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        r = urllib.request.urlopen(req, timeout=60)
        print(ep, "->", r.status, "urls:", len(urls))
    except Exception as e:
        print(ep, "->", e)
