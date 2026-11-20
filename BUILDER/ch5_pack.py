"""Unpack / repack a Crestron CH5 archive (.ch5z) without npm.
  python ch5_pack.py unpack  UI.ch5z        work_folder
  python ch5_pack.py pack    work_folder    Name        -> Name.ch5z
A .ch5z is a zip holding:  Name.ch5  (zip of the web files)  +  Name_manifest.json (sha-256 of the .ch5).
The official equivalent of 'pack' is:  ch5-cli archive -p Name -d work_folder -o out
"""
import sys, os, zipfile, hashlib, json, io, datetime

def unpack(ch5z, dest):
    with zipfile.ZipFile(ch5z) as z:
        inner = [n for n in z.namelist() if n.endswith(".ch5")][0]
        data = z.read(inner)
        man = [n for n in z.namelist() if n.endswith("_manifest.json")]
        if man:
            want = json.loads(z.read(man[0]))["sha-256"]
            got = hashlib.sha256(data).hexdigest()
            print("checksum OK" if want == got else f"WARNING checksum mismatch {want} != {got}")
    with zipfile.ZipFile(io.BytesIO(data)) as z2:
        for n in z2.namelist():                      # block path traversal
            if n.startswith("/") or ".." in n.split("/"): sys.exit(f"unsafe path in archive: {n}")
        z2.extractall(dest)
    print(f"unpacked {inner} -> {dest}")

def _info(arcname, is_dir=False):
    """Zip entry that matches Crestron's ch5-cli output: unix perms 644/755, folders as entries."""
    zi = zipfile.ZipInfo(arcname, date_time=datetime.datetime.now().timetuple()[:6])
    zi.create_system = 3                                   # unix
    zi.external_attr = ((0o40755 if is_dir else 0o100644) << 16) | (0x10 if is_dir else 0)
    zi.compress_type = zipfile.ZIP_STORED if is_dir else zipfile.ZIP_DEFLATED
    return zi

def pack(src, name):
    if not os.path.exists(os.path.join(src, "index.html")): sys.exit("index.html missing in folder")
    os.makedirs(os.path.join(src, "appui"), exist_ok=True)
    with open(os.path.join(src, "appui", "manifest"), "w") as f: f.write("apptype:ch5")
    entries = []
    for root, dirs, files in os.walk(src):
        rel = os.path.relpath(root, src).replace(os.sep, "/")
        if rel != ".": entries.append((rel + "/", None))
        for fn in files:
            if rel == "." and fn.lower().endswith((".csv", ".json", ".txt")): continue   # room.json + sheets stay out of the panel file
            entries.append(((fn if rel == "." else rel + "/" + fn), os.path.join(root, fn)))
    entries.sort(key=lambda e: e[0])                      # appui/ first, like ch5-cli
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for arc, full in entries:
            if full is None: z.writestr(_info(arc, True), b"")
            else:
                with open(full, "rb") as fh: z.writestr(_info(arc), fh.read())
    data = buf.getvalue()
    manifest = {"projectname": f"{name}.ch5",
                "modifiedtime": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
                "sha-256": hashlib.sha256(data).hexdigest()}
    out = f"{name}.ch5z"
    with zipfile.ZipFile(out, "w") as z:
        z.writestr(_info(f"{name}.ch5"), data)
        z.writestr(_info(f"{name}_manifest.json"), json.dumps(manifest, separators=(",", ":")))
    print(f"packed {src} -> {out} ({len(data)/1e6:.1f} MB)")

if __name__ == "__main__":
    if len(sys.argv) < 4: sys.exit(__doc__)
    {"unpack": unpack, "pack": pack}[sys.argv[1]](sys.argv[2], sys.argv[3])
