r"""Pack SOURCE into a dated .ch5z (uses BUILDER\ch5_pack.py) and refresh SHARE\Showroom_Demo.html.
Run from _PACK.bat."""
import os, sys, re, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import ch5_pack, make_share
NAME = "Showroom"
builds = os.path.join(ROOT, "BUILDS"); os.makedirs(builds, exist_ok=True)
vers = [tuple(map(int, m.groups())) for d in os.listdir(builds) for m in [re.search(r"-v(\d+)\.(\d+)", d)] if m]
last = max(vers) if vers else (1, -1)
sug = f"{last[0]}.{last[1] + 1}"
args = sys.argv[1:]
ver = (args[0] if args else input(f"Version [{sug}]: ").strip()) or sug
note = args[1] if len(args) > 1 else input("What changed (one line, Enter to skip): ").strip()
out = os.path.join(builds, datetime.date.today().strftime("%Y%m%d") + f"-v{ver}")
while os.path.exists(out): out += "b"
os.makedirs(out); os.chdir(out)
ch5_pack.pack(os.path.join(ROOT, "SOURCE"), NAME)
make_share.make(ROOT)
with open(os.path.join(ROOT, "CHANGES.txt"), "a", encoding="utf-8") as f:
    f.write(f"{datetime.date.today():%Y-%m-%d}  v{ver}  {note or '-'}\n")
print(f"\nDone: {os.path.join(out, NAME + '.ch5z')}")
if hasattr(os, "startfile") and not args: os.startfile(out)
