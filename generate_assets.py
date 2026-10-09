import os

def generate_test_assets():
    """
    Generates realistic test images for CivicTwin platform verification and demo suite.
    """
    os.makedirs("uploads", exist_ok=True)

    try:
        from PIL import Image, ImageDraw, ImageFont
        has_pil = True
    except ImportError:
        has_pil = False

    if has_pil:
        # 1. pothole_before.jpg: Dark asphalt with visible crater defect
        img1 = Image.new("RGB", (600, 400), color=(40, 40, 45))
        draw1 = ImageDraw.Draw(img1)
        draw1.ellipse([180, 100, 420, 300], fill=(20, 20, 25), outline=(100, 100, 110), width=5)
        draw1.ellipse([220, 130, 380, 270], fill=(10, 10, 15))
        draw1.rectangle([20, 20, 580, 55], fill=(0, 0, 0))
        draw1.text((30, 28), "INCIDENT #104: Anna Nagar School Pothole Defect (14 Reports)", fill=(255, 215, 0))
        img1.save("uploads/pothole_before.jpg", "JPEG", quality=85)

        # 2. fake_closure_black.jpg: Pitch black 200x200 (< 4KB) for desk spoofing detection
        img2 = Image.new("RGB", (200, 200), color=(0, 0, 0))
        img2.save("uploads/fake_closure_black.jpg", "JPEG", quality=10)

        # 3. genuine_closure_tar.jpg: Smooth dark charcoal asphalt with yellow road stripe
        img3 = Image.new("RGB", (600, 400), color=(50, 52, 55))
        draw3 = ImageDraw.Draw(img3)
        draw3.line([(0, 200), (600, 200)], fill=(250, 204, 21), width=12)  # Yellow stripe
        draw3.rectangle([20, 20, 580, 55], fill=(6, 78, 59))
        draw3.text((30, 28), "VERIFIED REPAIR: Fresh Asphalt Layer Applied", fill=(52, 211, 153))
        img3.save("uploads/genuine_closure_tar.jpg", "JPEG", quality=90)

        # 4. streetlight_broken.jpg: Broken streetlight fixture
        img4 = Image.new("RGB", (600, 400), color=(25, 30, 45))
        draw4 = ImageDraw.Draw(img4)
        draw4.rectangle([280, 60, 320, 380], fill=(120, 120, 130))  # Pole
        draw4.ellipse([240, 40, 360, 110], fill=(220, 38, 38))  # Broken lamp head
        draw4.rectangle([20, 20, 580, 55], fill=(0, 0, 0))
        draw4.text((30, 28), "INCIDENT #106: Broken Streetlight Dangling Wire", fill=(255, 255, 255))
        img4.save("uploads/streetlight_broken.jpg", "JPEG", quality=85)

        # 5. water_leak_before.jpg: if not already present, create a realistic water burst
        if not os.path.exists("uploads/water_leak_before.jpg"):
            img5 = Image.new("RGB", (600, 400), color=(30, 60, 90))
            draw5 = ImageDraw.Draw(img5)
            draw5.ellipse([100, 120, 500, 360], fill=(50, 120, 180), outline=(200, 230, 255), width=4)
            draw5.rectangle([20, 20, 580, 55], fill=(0, 0, 0))
            draw5.text((30, 28), "INCIDENT #102: Burst Drinking Water Main Pipe", fill=(100, 200, 255))
            img5.save("uploads/water_leak_before.jpg", "JPEG", quality=85)

        # Sync to frontend/public/uploads for direct high-speed client access
        import shutil
        os.makedirs("frontend/public/uploads", exist_ok=True)
        for fname in ["pothole_before.jpg", "fake_closure_black.jpg", "genuine_closure_tar.jpg", "streetlight_broken.jpg", "water_leak_before.jpg"]:
            src_f = os.path.join("uploads", fname)
            if os.path.exists(src_f):
                shutil.copy(src_f, os.path.join("frontend/public/uploads", fname))

        print("[CIVICTWIN ASSETS] Generated test images and synced to frontend/public/uploads.")
    else:
        # Fallback minimal JPEG creation if Pillow is not available
        def write_minimal_jpg(filepath, size_bytes=10000):
            header = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x27 ",#\x1c\x1c(7),01444\x1f\x27=82<.342\xff\xc0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\x7f\x00\xd9'
            data = header + b'\x00' * max(0, size_bytes - len(header))
            with open(filepath, "wb") as f:
                f.write(data)

        write_minimal_jpg("uploads/pothole_before.jpg", 12000)
        write_minimal_jpg("uploads/fake_closure_black.jpg", 2000)  # < 4KB
        write_minimal_jpg("uploads/genuine_closure_tar.jpg", 15000)
        write_minimal_jpg("uploads/streetlight_broken.jpg", 10000)
        if not os.path.exists("uploads/water_leak_before.jpg"):
            write_minimal_jpg("uploads/water_leak_before.jpg", 12000)
        print("[CIVICTWIN ASSETS] Generated 5 fallback test images.")


if __name__ == "__main__":
    generate_test_assets()
