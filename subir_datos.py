"""Sube datos/campo-sao-jose.json al servidor (Apps Script), que lo guarda en el Drive.
Uso: python -I subir_datos.py <URL /exec> <CLAVE>"""
import json, sys, pathlib, urllib.request
url, clave = sys.argv[1], sys.argv[2]
datos = json.loads((pathlib.Path(__file__).parent / 'datos' / 'campo-sao-jose.json').read_text(encoding='utf-8'))
cuerpo = json.dumps({'clave': clave, 'accion': 'datos', 'datos': datos}).encode('utf-8')
req = urllib.request.Request(url, data=cuerpo, headers={'Content-Type': 'text/plain;charset=utf-8'})
with urllib.request.urlopen(req, timeout=120) as r:
    print(r.read().decode('utf-8'))
