import './style.css'
import axios from 'axios'

// ─── State ───
let templateFile: File | null = null
let contentFile: File | null = null
let isLoading = false
let useAI = false

// ─── SVG Icons ───
const ICONS = {
  template: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  content: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  merge: `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`,
  check: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  upload: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  sparkles: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
}

// ─── Render ───
function render() {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="px-8 py-6 animate-fade-in-up" style="animation-delay: 0.05s">
        <div class="max-w-6xl mx-auto flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent))">
            <svg width="20" height="20" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text-primary)">
              WordFormatter
            </h1>
            <p class="text-xs" style="color: var(--color-text-muted)">
              Biçimlendirme & İçerik Birleştirici
            </p>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center px-8 pb-12">
        <div class="max-w-6xl w-full">
          <!-- Description -->
          <div class="text-center mb-10 animate-fade-in-up" style="animation-delay: 0.1s">
            <h2 class="text-3xl font-bold mb-3" style="background: linear-gradient(135deg, var(--color-text-primary), var(--color-primary-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Word Dosyalarını Birleştir
            </h2>
            <p class="text-base" style="color: var(--color-text-secondary); max-width: 520px; margin: 0 auto;">
              Şablon dosyasının biçimlendirmesini ve içerik dosyasının yazılarını tek bir dosyada birleştirin.
            </p>
          </div>

          <!-- Grid Layout -->
          <div class="grid gap-8" style="grid-template-columns: 1fr 1fr auto; align-items: center;">

            <!-- Template Dropzone -->
            <div class="animate-fade-in-up" style="animation-delay: 0.15s">
              ${renderDropzone('template', 'Biçimlendirme Şablonu', 'Formatlama kaynak dosyası (.docx)', templateFile)}
            </div>

            <!-- Content Dropzone -->
            <div class="animate-fade-in-up" style="animation-delay: 0.2s">
              ${renderDropzone('content', 'Yazı İçeriği', 'Metin kaynak dosyası (.docx)', contentFile)}
            </div>

            <!-- Merge Button Area -->
            <div class="animate-fade-in-up flex flex-col items-center gap-4" style="animation-delay: 0.25s; min-width: 220px;">
              <label class="flex items-center gap-2 cursor-pointer mb-2" style="color: var(--color-text-primary);">
                <input type="checkbox" id="ai-toggle" class="form-checkbox h-4 w-4 text-primary rounded border-gray-600 bg-gray-800" ${useAI ? 'checked' : ''} />
                <span class="flex items-center gap-1 text-sm font-medium">
                  ${ICONS.sparkles} Gemini AI ile Akıllı Birleştir
                </span>
              </label>

              <button id="merge-btn"
                class="merge-btn"
                ${!templateFile || !contentFile || isLoading ? 'disabled' : ''}>
                ${isLoading
                  ? `<span class="spinner"></span> ${useAI ? 'Yapay zeka metinleri analiz ediyor...' : 'İşleniyor...'}`
                  : `${ICONS.merge} Birleştir`
                }
              </button>
              <p class="text-xs text-center" style="color: var(--color-text-muted); max-width: 180px;">
                ${!templateFile && !contentFile
                  ? 'Her iki dosyayı da yükleyin'
                  : !templateFile
                    ? 'Şablon dosyası gerekli'
                    : !contentFile
                      ? 'İçerik dosyası gerekli'
                      : 'Birleştirmeye hazır ✨'}
              </p>
            </div>
          </div>

          <!-- Info Footer -->
          <div class="mt-12 text-center animate-fade-in-up" style="animation-delay: 0.3s">
            <div class="inline-flex items-center gap-6 px-6 py-3 rounded-xl"
                 style="background: rgba(30,41,59,.5); border: 1px solid var(--color-border);">
              <span class="flex items-center gap-2 text-xs" style="color: var(--color-text-muted)">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);display:inline-block;"></span>
                Kural tabanlı motor
              </span>
              <span class="flex items-center gap-2 text-xs" style="color: var(--color-text-muted)">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--color-success);display:inline-block;"></span>
                Paragraf eşleştirme
              </span>
              <span class="flex items-center gap-2 text-xs" style="color: var(--color-text-muted)">
                <span style="width:8px;height:8px;border-radius:50%;background:var(--color-accent);display:inline-block;"></span>
                Biçim koruma
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
  bindEvents()
}

function renderDropzone(id: string, title: string, subtitle: string, file: File | null): string {
  const icon = id === 'template' ? ICONS.template : ICONS.content
  const displayIcon = file ? ICONS.check : icon

  return `
    <div id="dropzone-${id}" class="dropzone ${file ? 'has-file' : ''}">
      <input type="file" id="input-${id}" accept=".docx" style="display:none" />
      <div class="dropzone-icon">${displayIcon}</div>
      <h3 class="text-sm font-semibold mb-1" style="color: var(--color-text-primary)">${title}</h3>
      <p class="text-xs mb-3" style="color: var(--color-text-muted)">${subtitle}</p>
      ${file
        ? `<div class="file-chip">
             <span class="file-chip-name">${file.name}</span>
             <button class="file-chip-remove" data-remove="${id}" title="Kaldır">✕</button>
           </div>`
        : `<p class="text-xs" style="color: var(--color-text-secondary)">
             Sürükleyip bırakın veya tıklayın
           </p>`
      }
    </div>
  `
}

// ─── Events ───
function bindEvents() {
  setupDropzone('template', (f) => { templateFile = f; render() })
  setupDropzone('content', (f) => { contentFile = f; render() })

  // Remove buttons
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const target = (btn as HTMLElement).dataset.remove
      if (target === 'template') templateFile = null
      else contentFile = null
      render()
    })
  })

  // Merge button
  document.getElementById('merge-btn')?.addEventListener('click', handleMerge)

  // AI Toggle
  document.getElementById('ai-toggle')?.addEventListener('change', (e) => {
    useAI = (e.target as HTMLInputElement).checked
  })
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

    const endpoint = useAI ? '/api/ai-merge' : '/api/merge'

    const response = await axios.post(endpoint, formData, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'merged_output.docx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    showToast('Dosya başarıyla birleştirildi ve indirildi! ✓', 'success')
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

  setTimeout(() => toast.remove(), 4000)
}

// ─── Init ───
render()
