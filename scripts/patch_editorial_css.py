from pathlib import Path
p = Path(__file__).resolve().parents[1] / 'assets/editorial.css'
s = p.read_text(encoding='utf-8')
start = s.index('.community-callout{')
end = s.index('.site-footer{', start)
replacement = '.community-strip{max-width:var(--max);margin:34px auto 0;padding:15px 22px;border:1px solid var(--line);border-radius:14px;background:#fff3ed;color:var(--brown);display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:13px}.community-strip strong{color:var(--ink)}.community-strip a{color:var(--coral-dark)!important;text-decoration:none;font-weight:800;white-space:nowrap}.community-strip a:hover{text-decoration:underline}.community-callout{display:none}.button-light{background:#fff8f5;color:var(--ink)!important;white-space:nowrap}.button-light:hover{background:#ffd0bb}'
s = s[:start] + replacement + s[end:]
s = s.replace('.community-callout{margin-left:0;margin-right:0;padding:28px 24px;align-items:flex-start;flex-direction:column}.button-light{width:100%}', '.community-strip{margin-top:24px;margin-left:20px;margin-right:20px;align-items:flex-start;flex-direction:column;padding:14px 16px}.community-strip a{white-space:normal}.button-light{width:100%}')
p.write_text(s, encoding='utf-8')
print('editorial css atualizado')
