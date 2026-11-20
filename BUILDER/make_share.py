r"""Build SHARE\Showroom_Demo.html: the whole demo in one offline file (no Crestron libraries)."""
import os, re, base64
def make(root):
    src = os.path.join(root, "SOURCE")
    rd = lambda *p: open(os.path.join(src, *p), encoding="utf-8").read()
    fonts = re.sub(r"url\(\.\./fonts/([^)]+)\)", lambda m: "url(data:font/woff2;base64," +
        base64.b64encode(open(os.path.join(src, "fonts", m.group(1)), "rb").read()).decode() + ")", rd("css", "fonts.css"))
    html = ('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
        '<meta name="apple-mobile-web-app-capable" content="yes"><title>The Showroom</title><style>' + fonts + rd("css", "app.css") +
        '</style></head><body><div id="stage"></div><script>' + rd("js", "app.js") + '</script></body></html>')
    os.makedirs(os.path.join(root, "SHARE"), exist_ok=True)
    out = os.path.join(root, "SHARE", "Showroom_Demo.html")
    open(out, "w", encoding="utf-8").write(html); print("share file ->", out)
if __name__ == "__main__": make(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
