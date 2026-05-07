import json
import os
import sys
import urllib.request
import subprocess


def mean_centroid(coords):
    s_lon = s_lat = 0.0
    n = 0
    for lon, lat in coords:
        s_lon += lon
        s_lat += lat
        n += 1
    if n == 0:
        return None
    return s_lat / n, s_lon / n


def flatten_coords(geom):
    t = geom.get("type")
    c = geom.get("coordinates")
    pts = []
    if not c:
        return pts
    if t == "Polygon":
        for ring in c:
            pts.extend(ring)
    elif t == "MultiPolygon":
        for poly in c:
            for ring in poly:
                pts.extend(ring)
    elif t == "Point":
        pts.append(c)
    return pts


def main():
    paths = subprocess.check_output(
        [
            "gh",
            "api",
            "repos/faeldon/philippines-json-maps/git/trees/master?recursive=1",
            "--jq",
            ".tree[].path",
        ],
        text=True,
    ).splitlines()

    paths = [
        p
        for p in paths
        if p.startswith("2011/geojson/barangays/barangays-municity-")
        and p.endswith(".json")
    ]

    # Select a broad spread of municipalities to ensure diversity.
    selected = []
    step = max(1, len(paths) // 120)
    for i in range(0, len(paths), step):
        selected.append(paths[i])
        if len(selected) >= 120:
            break

    entries = []
    seen = set()
    per_province = {}
    per_municity = {}

    for path in selected:
        url = f"https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/{path}"
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                data = json.load(r)
        except Exception as e:
            print("skip", path, e, file=sys.stderr)
            continue

        for feat in data.get("features", []):
            props = feat.get("properties") or {}
            name = props.get("NAME_3")
            municipality = props.get("NAME_2")
            province = props.get("NAME_1")
            region = props.get("REGION") or props.get("NAME_0")
            if not (name and municipality and province and region):
                continue

            # Diversity caps
            per_province.setdefault(province, 0)
            per_municity.setdefault((province, municipality), 0)
            if per_province[province] >= 12:
                continue
            if per_municity[(province, municipality)] >= 8:
                continue

            key = (
                name.strip().lower(),
                municipality.strip().lower(),
                province.strip().lower(),
            )
            if key in seen:
                continue

            pts = flatten_coords(feat.get("geometry") or {})
            cen = mean_centroid(pts)
            if not cen:
                continue

            lat, lon = cen
            entries.append(
                {
                    "name": name,
                    "municipality": municipality,
                    "province": province,
                    "region": region,
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                }
            )
            seen.add(key)
            per_province[province] += 1
            per_municity[(province, municipality)] += 1
            if len(entries) >= 160:
                break
        if len(entries) >= 160:
            break

    if len(entries) < 100:
        raise SystemExit(f"Only got {len(entries)} entries")

    entries = entries[:160]

    out_dir = os.path.join("src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "barangays.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"wrote {len(entries)} entries to {out_file}")


if __name__ == "__main__":
    main()

