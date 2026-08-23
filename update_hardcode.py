import json
import re

with open('temp_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

qrcodes = db['qrcodes']

# Update server.py
with open('server.py', 'r', encoding='utf-8') as f:
    server_code = f.read()

# Replace DEFAULT_DB = { ... "qrcodes": [ ... ] } with the new qrcodes
start_idx = server_code.find('DEFAULT_DB = {')
end_idx = server_code.find('}', server_code.rfind('"options":'))
end_idx = server_code.find(']', end_idx) + 1
end_idx = server_code.find('}', end_idx) + 1

py_db_str = json.dumps({"qrcodes": qrcodes}, indent=4)
py_db_str = re.sub(r'\btrue\b', 'True', py_db_str)
py_db_str = re.sub(r'\bfalse\b', 'False', py_db_str)
py_db_str = re.sub(r'\bnull\b', 'None', py_db_str)
new_db_str = "DEFAULT_DB = " + py_db_str
server_code = server_code[:start_idx] + new_db_str + server_code[end_idx:]

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(server_code)

# Update storage.js
with open('storage.js', 'r', encoding='utf-8') as f:
    storage_code = f.read()

start_idx = storage_code.find('const defaultQRs = [')
end_idx = storage_code.find('];', start_idx) + 2

new_qrs_str = "const defaultQRs = " + json.dumps(qrcodes, indent=4) + ";"
storage_code = storage_code[:start_idx] + new_qrs_str + storage_code[end_idx:]

with open('storage.js', 'w', encoding='utf-8') as f:
    f.write(storage_code)

print("Updated server.py and storage.js")
