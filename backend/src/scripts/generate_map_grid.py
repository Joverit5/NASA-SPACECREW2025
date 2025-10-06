"""
generate_map_grid.py

Genera un JSON grid (width x height) booleano a partir de una imagen:
- Detecta paredes (colores oscuros), áreas caminables (colores claros) y puertas (azules)
- Las puertas se consideran caminables
- Opcionalmente aplicar dilatación para expandir muros

Salida:
  { "width": N, "height": N, "cells": [ [true,false,...], ... ] }
"""
import argparse, json, os
from PIL import Image, ImageFilter

def is_door(px):
    """Detecta si un pixel es una puerta (tonos azules)"""
    r, g, b = px[:3]
    # Las puertas son azules: más azul que rojo/verde
    return b > 100 and b > r + 20 and b > g + 20

def is_wall(px, threshold):
    """Detecta si un pixel es una pared (oscuro)"""
    r, g, b = px[:3]
    # Rec.709 luminance
    brightness = 0.2126*r + 0.7152*g + 0.0722*b
    return brightness < threshold

def sample_grid(img, size, threshold):
    """
    Muestrea la imagen en una cuadrícula de size x size
    - Paredes (oscuras) -> False (no permitido)
    - Puertas (azules) -> True (permitido)
    - Áreas claras -> True (permitido)
    """
    img_small = img.resize((size, size), resample=Image.Resampling.BILINEAR)
    w, h = img_small.size
    cells = []
    
    for y in range(h):
        row = []
        for x in range(w):
            px = img_small.getpixel((x, y))
            
            # Primero verificar si es una puerta (siempre permitido)
            if is_door(px):
                row.append(True)
            # Luego verificar si es una pared (no permitido)
            elif is_wall(px, threshold):
                row.append(False)
            # Si no es ni puerta ni pared, es área caminable
            else:
                row.append(True)
        cells.append(row)
    
    return cells

def dilate_grid(cells, iterations=1):
    """Expande las celdas bloqueadas (paredes) a sus vecinos"""
    h = len(cells)
    w = len(cells[0])
    cur = [row[:] for row in cells]
    
    for it in range(iterations):
        nxt = [row[:] for row in cur]
        for y in range(h):
            for x in range(w):
                if cur[y][x] == False:
                    # Expandir a vecinos
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny = y + dy
                            nx = x + dx
                            if 0 <= ny < h and 0 <= nx < w:
                                nxt[ny][nx] = False
        cur = nxt
    
    return cur

def main():
    p = argparse.ArgumentParser(description='Genera map_grid.json desde una imagen de mapa')
    p.add_argument('input', help='Ruta de la imagen de entrada (ej: ../public/assets/maps/map.png)')
    p.add_argument('output', help='Ruta del JSON de salida (ej: ../public/assets/maps/map_grid.json)')
    p.add_argument('--size', type=int, default=128, help='Tamaño de la cuadrícula (N -> NxN) [default: 128]')
    p.add_argument('--threshold', type=int, default=100, help='Umbral de brillo para paredes (0-255) [default: 100]')
    p.add_argument('--dilate', type=int, default=1, help='Expandir paredes por N iteraciones [default: 1]')
    p.add_argument('--blur', type=int, default=0, help='Aplicar desenfoque gaussiano antes de procesar [default: 0]')
    args = p.parse_args()

    if not os.path.exists(args.input):
        print(f'❌ Error: No se encontró el archivo: {args.input}')
        return

    print(f'📖 Leyendo imagen: {args.input}')
    img = Image.open(args.input).convert('RGBA')
    
    if args.blur and args.blur > 0:
        print(f'🌫️  Aplicando desenfoque gaussiano (radio={args.blur})...')
        img = img.filter(ImageFilter.GaussianBlur(radius=args.blur))
    
    print(f'🔍 Analizando mapa (tamaño={args.size}x{args.size}, umbral={args.threshold})...')
    cells = sample_grid(img, args.size, args.threshold)

    if args.dilate and args.dilate > 0:
        print(f'📏 Expandiendo paredes ({args.dilate} iteraciones)...')
        cells = dilate_grid(cells, iterations=args.dilate)

    # Calcular estadísticas
    total_cells = args.size * args.size
    walkable_cells = sum(sum(row) for row in cells)
    blocked_cells = total_cells - walkable_cells
    
    out = {
        "width": args.size,
        "height": args.size,
        "cells": cells
    }
    
    with open(args.output, 'w') as f:
        json.dump(out, f, indent=2)
    
    print(f'✅ Archivo generado: {args.output}')
    print(f'📊 Estadísticas:')
    print(f'   - Tamaño: {args.size}x{args.size} ({total_cells} celdas)')
    print(f'   - Caminables: {walkable_cells} ({walkable_cells*100//total_cells}%)')
    print(f'   - Bloqueadas: {blocked_cells} ({blocked_cells*100//total_cells}%)')
    print(f'   - Umbral: {args.threshold}')
    print(f'   - Dilatación: {args.dilate}')

if __name__ == '__main__':
    main()
