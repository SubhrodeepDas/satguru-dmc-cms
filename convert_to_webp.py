import os
import glob
import re
from PIL import Image

BASE_DIR = r"C:\Users\PC\Downloads\satguru-dmc-new"
IMG_DIR = os.path.join(BASE_DIR, "assets", "img")

EXTENSIONS = ['.jpg', '.jpeg', '.png']
SKIP_FILES = {'satguru-logo-new.gif'}  # skip animated gif

converted = []
errors = []

for ext in EXTENSIONS:
    for img_path in glob.glob(os.path.join(IMG_DIR, "**", f"*{ext}"), recursive=True) + \
                    glob.glob(os.path.join(IMG_DIR, "**", f"*{ext.upper()}"), recursive=True):
        if os.path.basename(img_path) in SKIP_FILES:
            continue
        webp_path = os.path.splitext(img_path)[0] + ".webp"
        try:
            with Image.open(img_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    out = img.convert('RGBA')
                    out.save(webp_path, 'WEBP', lossless=True, quality=100, method=6)
                else:
                    out = img.convert('RGB')
                    out.save(webp_path, 'WEBP', lossless=True, quality=100, method=6)
            converted.append((img_path, webp_path))
            print(f"OK  {os.path.relpath(img_path, BASE_DIR)}")
        except Exception as e:
            errors.append((img_path, str(e)))
            print(f"ERR {os.path.relpath(img_path, BASE_DIR)}: {e}")

print(f"\n=== Converted {len(converted)} images, {len(errors)} errors ===\n")

# --- Update references in HTML / CSS / JS files ---
TEXT_GLOBS = ['*.html', 'assets/css/*.css', 'assets/css/*.min.css',
              'assets/js/*.js', 'assets/js/*.min.js']

def make_pattern(ext):
    # match the extension (case-insensitive) in quoted or unquoted urls
    return re.compile(re.escape(ext), re.IGNORECASE)

updated_files = []
for g in TEXT_GLOBS:
    for fpath in glob.glob(os.path.join(BASE_DIR, g)):
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        original = content
        for ext in EXTENSIONS:
            # replace .ext and .EXT with .webp (avoid double-replacing already .webp)
            content = re.sub(
                r'(?i)(' + re.escape(ext) + r')(?=["\'\s\)\?]|$)',
                '.webp',
                content
            )
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            updated_files.append(os.path.relpath(fpath, BASE_DIR))
            print(f"Updated refs: {os.path.relpath(fpath, BASE_DIR)}")

print(f"\n=== Updated references in {len(updated_files)} files ===")
