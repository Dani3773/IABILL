// Lê o texto de um PDF no próprio navegador. O arquivo não é enviado ao servidor:
// só o texto extraído vira o conteúdo do documento, que depois passa pela mesma
// revisão e aprovação de qualquer outro conteúdo.
//
// A biblioteca (pdf.js) é carregada só quando alguém escolhe um PDF, para não
// pesar no carregamento inicial do sistema.

export const MAX_PDF_BYTES = 10 * 1024 * 1024

export class PdfWithoutTextError extends Error {}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    let text = ''
    for (const item of content.items) {
      if ('str' in item) {
        text += item.str + (item.hasEOL ? '\n' : ' ')
      }
    }
    pages.push(text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim())
  }
  await loadingTask.destroy()

  const text = pages.filter(Boolean).join('\n\n')
  // PDF digitalizado (só imagem) não tem camada de texto para extrair.
  if (text.replace(/\s/g, '').length < 20) {
    throw new PdfWithoutTextError()
  }
  return text
}
