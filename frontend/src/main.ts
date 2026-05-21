import './style.css'
import axios from 'axios'

// ─── State ───
let templateFile: File | null = null
let contentFile: File | null = null
let isLoading = false

// ─── SVG Icons ───
const ICONS = {
  template: `<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  content:  `<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  merge:    `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`,
  check:    `<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  sparkles: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  download: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  arrow:    `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
}

// ─── Render ───
function render() {
  const app = document.getElementById('app')!
  const canMerge = !!templateFile && !!contentFile && !isLoading

  app.innerHTML = `
    <div class="app-wrapper">
      <!-- Header -->
      <header class="header animate-up" style="--delay:.05s">
        <div class="header-inner">
          <div class="logo-icon">
            <svg width="18" height="18" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div class="logo-title">WordFormatter</div>
            <div class="logo-sub">HK Prosedür Birleştirici</div>
          </div>
          <div class="header-badge">
            ${ICONS.sparkles}
            <span>Gemini AI</span>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <main class="main-content">
        <div class="hero animate-up" style="--delay:.1s">
          <div class="hero-pill">${ICONS.sparkles} Yapay Zeka Destekli</div>
          <h2 class="hero-title">Prosedür Belgesi Oluştur</h2>
          <p class="hero-desc">Şablon dosyasının biçimlendirmesini ve eski yazıdaki içerikleri birleştirerek Gemini AI ile akıllıca tamamlanmış profesyonel bir prosedür belgesi oluşturun.</p>
        </div>

        <!-- Upload Area -->
        <div class="upload-section animate-up" style="--delay:.18s">
          <!-- Template -->
          <div class="upload-card ${templateFile ? 'has-file' : ''}" id="dropzone-template">
            <input type="file" id="input-template" accept=".docx" style="display:none"/>
            <div class="upload-card-icon template-icon">
              ${templateFile ? ICONS.check : ICONS.template}
            </div>
            <div class="upload-card-label">Biçimlendirme Şablonu</div>
            <div class="upload-card-sub">Format ve tasarım kaynağı (.docx)</div>
            ${templateFile
              ? `<div class="file-chip"><span class="file-chip-name">${templateFile.name}</span><button class="file-chip-remove" data-remove="template">✕</button></div>`
              : `<div class="upload-hint">Sürükle & Bırak veya Tıkla</div>`
            }
          </div>

          <!-- Arrow -->
          <div class="upload-arrow">${ICONS.arrow}</div>

          <!-- Content -->
          <div class="upload-card ${contentFile ? 'has-file' : ''}" id="dropzone-content">
            <input type="file" id="input-content" accept=".docx" style="display:none"/>
            <div class="upload-card-icon content-icon">
              ${contentFile ? ICONS.check : ICONS.content}
            </div>
            <div class="upload-card-label">Yazı İçeriği</div>
            <div class="upload-card-sub">Eski yazı, metin kaynağı (.docx)</div>
            ${contentFile
              ? `<div class="file-chip"><span class="file-chip-name">${contentFile.name}</span><button class="file-chip-remove" data-remove="content">✕</button></div>`
              : `<div class="upload-hint">Sürükle & Bırak veya Tıkla</div>`
            }
          </div>
        </div>

        <!-- Status + Button -->
        <div class="action-area animate-up" style="--delay:.26s">
          <div class="status-text">
            ${!templateFile && !contentFile
              ? 'Her iki dosyayı da yükleyin'
              : !templateFile
                ? '⬆ Şablon dosyası bekleniyor'
                : !contentFile
                  ? '⬆ İçerik dosyası bekleniyor'
                  : '✓ Dosyalar hazır — birleştirmeye başlayabilirsiniz'
            }
          </div>

          <button
            id="merge-btn"
            class="merge-btn ${canMerge ? '' : 'disabled'}"
            ${canMerge ? '' : 'disabled'}
          >
            ${isLoading
              ? `<span class="spinner"></span><span>Gemini AI analiz ediyor...</span>`
              : `${ICONS.download}<span>Birleştir & İndir</span>`
            }
          </button>

          <div class="ai-note">
            ${ICONS.sparkles}
            <span>Gemini AI ile başlıkları analiz edip içerikleri otomatik yerleştirir</span>
          </div>
        </div>

        <!-- Features -->
        <div class="features animate-up" style="--delay:.34s">
          <div class="feature-pill">
            <span class="dot dot-primary"></span>Başlık Koruma
          </div>
          <div class="feature-pill">
            <span class="dot dot-accent"></span>Otomatik Yerleştirme
          </div>
          <div class="feature-pill">
            <span class="dot dot-success"></span>Boşluk Doldurma
          </div>
          <div class="feature-pill">
            <span class="dot dot-warn"></span>HK Standartları
          </div>
        </div>
      </main>
    </div>
  `
  bindEvents()
}

// ─── Events ───
function bindEvents() {
  setupDropzone('template', (f) => { templateFile = f; render() })
  setupDropzone('content', (f) => { contentFile = f; render() })

  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const target = (btn as HTMLElement).dataset.remove
      if (target === 'template') templateFile = null
      else contentFile = null
      render()
    })
  })

  document.getElementById('merge-btn')?.addEventListener('click', handleMerge)
}

function setupDropzone(id: string, onFile: (f: File) => void) {
  const zone = document.getElementById(`dropzone-${id}`)!
  const input = document.getElementById(`input-${id}`) as HTMLInputElement

  zone.addEventListener('click', () => input.click())

  input.addEventListener('change', () => {
    if (input.files?.[0]) {
      if (validateFile(input.files[0])) onFile(input.files[0])
    }
  })

  zone.addEventListener('dragover', (e) => {
    e.preventDefault()
    zone.classList.add('drag-over')
  })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'))
  zone.addEventListener('drop', (e) => {
    e.preventDefault()
    zone.classList.remove('drag-over')
    const file = (e as DragEvent).dataTransfer?.files[0]
    if (file && validateFile(file)) onFile(file)
  })
}

function validateFile(file: File): boolean {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    showToast('Sadece .docx dosyaları kabul edilmektedir.', 'error')
    return false
  }
  return true
}

// ─── Merge Handler ───
async function handleMerge() {
  if (!templateFile || !contentFile || isLoading) return

  isLoading = true
  render()

  try {
    const formData = new FormData()
    formData.append('template', templateFile)
    formData.append('content', contentFile)

    // Always use AI endpoint
    const response = await axios.post('/api/ai-merge', formData, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'prosedur_output.docx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    showToast('Dosya başarıyla oluşturuldu ve indirildi! ✓', 'success')
  } catch (err: any) {
    const msg = err.response?.data?.detail || 'Birleştirme sırasında bir hata oluştu.'
    showToast(msg, 'error')
  } finally {
    isLoading = false
    render()
  }
}

// ─── Toast ───
function showToast(message: string, type: 'success' | 'error') {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4500)
}

// ─── Init ───
render()
