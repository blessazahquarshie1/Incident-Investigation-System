import re

with open('docs/PROGRESS.md', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\| 01 \|.*?\|', '| 01 | Font size fix + shared components | done | pass | - |', content)
content = re.sub(r'\| 02 \|.*?\|', '| 02 | Types, mock data, store | done | pass | - |', content)
content = re.sub(r'\| 03 \|.*?\|', '| 03 | Dashboard | done | pass | - |', content)
content = re.sub(r'\| 04 \|.*?\|', '| 04 | Lists, filters, search | done | pass | - |', content)
content = re.sub(r'\| 05 \|.*?\|', '| 05 | Case details (9 tabs) | done | pass | - |', content)

with open('docs/PROGRESS.md', 'w', encoding='utf-8') as f:
    f.write(content)
