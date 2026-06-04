#!/usr/bin/env python3
"""
压缩 photos/ 下的所有图片。

用法:
  python tools/compress.py
  python tools/compress.py --max 1600 --quality 80
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("缺少 Pillow,请运行: pip install Pillow")
    sys.exit(1)


def human_size(n):
    for unit in ["B", "KB", "MB", "GB"]:
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def compress_one(path, max_dim, quality):
    orig_size = path.stat().st_size
    try:
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
    except Exception as e:
        return orig_size, orig_size, False, f"无法打开: {e}"

    if img.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    elif img.mode == "P":
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
        img = img.resize(new_size, Image.LANCZOS)

    img.save(
        path,
        "JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        dpi=(72, 72),
    )

    new_size = path.stat().st_size
    return orig_size, new_size, True, ""


def main():
    parser = argparse.ArgumentParser(description="压缩 photos/ 下的所有图片")
    parser.add_argument(
        "--dir",
        default="D:/BaiduSyncdisk/Ten-years/photos",
        help="目标文件夹",
    )
    parser.add_argument("--max", type=int, default=1920, help="长边最大像素")
    parser.add_argument("--quality", type=int, default=85, help="JPEG 质量 1-95")
    args = parser.parse_args()

    photos_dir = Path(args.dir)
    if not photos_dir.exists():
        print(f"找不到 {photos_dir}")
        sys.exit(1)

    exts = {".jpg", ".jpeg", ".png", ".webp"}
    files = sorted([p for p in photos_dir.iterdir() if p.suffix.lower() in exts])

    if not files:
        print("没有可压缩的图片")
        return

    print(f"目标: {photos_dir}")
    print(f"参数: 长边<={args.max}px, JPEG q={args.quality}")
    nl = chr(10)  # newline character
    print(f"文件: {len(files)} 张" + nl)
    print(f"{'文件':<42} {'原大小':>10} {'新大小':>10} {'节省':>8}  {'尺寸':>12}")
    print("-" * 90)

    total_orig = 0
    total_new = 0
    success = 0
    fail = 0

    for p in files:
        orig, new, ok, err = compress_one(p, args.max, args.quality)
        total_orig += orig
        total_new += new
        if ok:
            success += 1
            saved = (orig - new) / orig * 100 if orig else 0
            with Image.open(p) as im:
                w, h = im.size
            print(
                f"{p.name:<42} {human_size(orig):>10} {human_size(new):>10} "
                f"{saved:>7.1f}%  {w}x{h:>5}"
            )
        else:
            fail += 1
            print(f"{p.name:<42} {human_size(orig):>10} {'失败':>10}")
            print(f"   {err}")

    print("-" * 90)
    saved_pct = (1 - total_new / total_orig) * 100 if total_orig else 0
    print(
        f"{'总计':<42} {human_size(total_orig):>10} {human_size(total_new):>10} "
        f"{saved_pct:>7.1f}%"
    )
    tail = f" ({fail} 张失败)" if fail else ""
    print(f"完成 {success}/{len(files)} 张" + tail)
    print(f"节省 {human_size(total_orig - total_new)} ({saved_pct:.1f}%)")
    backup = Path.home() / "Desktop" / "我们的故事"
    print(f"原图备份在: {backup}")


if __name__ == "__main__":
    main()
