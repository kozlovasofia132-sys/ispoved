import re

with open('d:/Ispoved/src/data/prayers.js', 'r', encoding='utf-8') as f:
    content = f.read()

with open('d:/Ispoved/src/data/canon.txt', 'r', encoding='utf-8') as f:
    canon = f.read()

# I want to insert the repentanceCanon before each beforeCommunion key
# But I need to be careful. The canon text already contains "repentanceCanon: `" so I just insert canon before `beforeCommunion`
new_content = re.sub(r'(\s+beforeCommunion:\s+`)', r'\n' + canon.replace('\\', '\\\\') + r'\1', content)

with open('d:/Ispoved/src/data/prayers.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done')
