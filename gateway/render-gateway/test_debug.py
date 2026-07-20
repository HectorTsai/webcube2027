import sys, re
html = sys.stdin.read()

# 找第一個 Card 區域的 div classes
idx = html.find('cube-color-primary')
chunk = html[idx:idx+2000]

# 過濾 div
for m in re.finditer(r'<div class="([^"]*)"', chunk):
    print('  class="' + m.group(1) + '"')

print("---")
# 也找 body div 內的子 div
body_start = chunk.find('flex-1 min-w-0')
if body_start >= 0:
    body_chunk = chunk[body_start:body_start+600]
    for m in re.finditer(r'<div class="([^"]*)"', body_chunk):
        print('  body-child class="' + m.group(1) + '"')
