from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

vite = ROOT / 'vite.config.ts'
s = vite.read_text()
s = s.replace("export default defineConfig(() => {\n  return {", "export default defineConfig(() => {\n  return {\n    base: '/app/',")
s = s.replace("id: '/',", "id: '/app/',").replace("start_url: '/',", "start_url: '/app/',").replace("scope: '/',", "scope: '/app/',")
s = s.replace("src: '/icon-192.png'", "src: '/app/icon-192.png'").replace("src: '/icon-512.png'", "src: '/app/icon-512.png'").replace("src: '/icon-maskable-512.png'", "src: '/app/icon-maskable-512.png'").replace("src: '/icon-192.svg'", "src: '/app/icon-192.svg'").replace("src: '/icon-512.svg'", "src: '/app/icon-512.svg'")
vite.write_text(s)

html = ROOT / 'index.html'
s = html.read_text()
s = s.replace('<title>DoceGestor — Gestão de Confeitaria PWA</title>', '<title>DoceGestor — Gestão de Confeitaria</title>')
s = s.replace('<link rel="manifest" href="/manifest.json" />', '<link rel="manifest" href="/app/manifest.webmanifest" />')
html.write_text(s)

config = ROOT / 'src/views/ConfigView.tsx'
s = config.read_text()
s = s.replace('Conheça os projetos de Saulomgg (saulomgg.github.io)', 'Conheça meus projetos')
old = '''            <span>Conheça meus projetos</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>'''
new = '''            <span>Conheça meus projetos</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <div className="w-full sm:w-auto flex flex-col items-center sm:items-start gap-1 text-center sm:text-left">
            <a href="https://docegestor.github.io/" target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: currentTheme.textMain }}>
              Site oficial do DoceGestor
            </a>
            <a href="https://github.com/docegestor/docegestor.github.io/issues/new" target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: currentTheme.textMuted }}>
              Feedback, melhorias e dicas
            </a>
          </div>'''
if old not in s:
    raise SystemExit('bloco de projetos não encontrado')
s = s.replace(old, new, 1)
config.write_text(s)

app = ROOT / 'src/App.tsx'
s = app.read_text()
s = s.replace('DoceGestor App v2.5 Desenvolvido por', 'DoceGestor App v2.5 · Privado por padrão · Desenvolvido por')
old = '''          <div>
            <button
              onClick={() => handleSelectTab('config', { scrollToApoio: true })}'''
new = '''          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="https://docegestor.github.io/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95 shadow-xs border" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textMain }}>
              Site oficial
            </a>
            <a href="https://github.com/docegestor/docegestor.github.io/issues/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95 shadow-xs border" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border, color: currentTheme.textMain }}>
              Feedback e melhorias
            </a>
            <button
              onClick={() => handleSelectTab('config', { scrollToApoio: true })}'''
if old not in s:
    raise SystemExit('footer do app não encontrado')
s = s.replace(old, new, 1)
app.write_text(s)
print('app atualizado para /app/ com links oficiais')
