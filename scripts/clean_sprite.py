import sys
from PIL import Image

def process_sprite(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    newData = []
    for item in data:
        # Check if the pixel is white-ish
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        elif item[0] < 20 and item[1] < 20 and item[2] < 20 and item[3] > 0:
            # Maybe keep dark pixels but check text
            newData.append(item)
        else:
            newData.append(item)
    img.putdata(newData)
    
    width, height = img.size
    row_height = height // 4
    col_width = width // 5
    
    clean_img = Image.new("RGBA", (width, height), (0,0,0,0))
    
    for r in range(4):
        upper_offset = int(row_height * 0.18)
        box = (0, r * row_height + upper_offset, width, (r + 1) * row_height)
        row_img = img.crop(box)
        clean_img.paste(row_img, (0, r * row_height + upper_offset))

    clean_img.save(output_path, "PNG")
    print(f"Saved cleaned sprite to {output_path}")

if __name__ == "__main__":
    process_sprite(sys.argv[1], sys.argv[2])
