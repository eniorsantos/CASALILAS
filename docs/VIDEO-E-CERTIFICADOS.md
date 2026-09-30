# Vídeo seguro e certificados

## Por que URL assinada

URL direta de `.mp4` no banco = link compartilhável para sempre. Aqui o banco guarda só o **ID do vídeo** (`Lesson.videoAssetId`) e cada acesso gera uma **URL HLS com expiração de 4h**.

## Fluxo Mux (recomendado)

1. **Upload (instrutor):** `POST api/admin/lessons/[id]/upload` cria upload direto com `playback_policy: ["signed"]`; o browser envia ao Mux via `VideoUploader` (upchunk, chunks de 5 MB) sem passar pelo Next; `videoAssetId` guarda o `upload_id` temporário.
2. **Webhook:** `POST api/webhooks/mux` só enfileira (`videoQueue`) e responde rápido; o worker troca `upload_id` → `playback_id` definitivo em `video.asset.ready` (e loga `video.asset.errored`).
3. **Playback (aluno):** `GET api/lessons/[id]/playback-url` → `hasAccessToCourse()` (ou `isFreePreview`) → `getSignedPlaybackUrl()` (JWT `RS256`, `aud: "v"`, exp 4h) → `https://stream.mux.com/{id}.m3u8?token=…`.
4. **Player:** `VideoPlayer` (hls.js + fallback Safari, `nodownload`, sem menu de contexto) envia progresso a cada 15s para `POST api/lessons/[id]/progress`.

Alternativa Bunny: `getBunnySignedUrl()` (SHA-256 de `chave + caminho + expiração`) — mesmo princípio. Limite honesto: nada impede gravação de tela; a proteção cobre compartilhamento de links. Para conteúdo premium, considerar marca d'água dinâmica com o email do aluno (Mux/Bunny suportam).

## Progresso

`progress/route.ts`: `upsert` de `LessonProgress`; conclusão a ≥90% de `durationSecs`; ao concluir, `queueCertificateCheck()` (não bloqueia a resposta).

## Certificados

- Trigger: fila `certificate` (`jobId = cert-{userId}-{courseId}` — sem duplicata) → `issueCertificateIfEligible()`: confere 100% das aulas, retorna existente ou cria com `verificationHash = crypto.randomBytes(16)`.
- PDF: `generate-certificate-pdf.ts` (HTML→Puppeteer; `@sparticuz/chromium` + `puppeteer-core` em serverless), upload via `lib/storage.ts`, email `certificate-issued-email` pela fila.
- **Verificação pública:** `/certificados/verificar/[hash]` mostra nome + curso + data, ou "não encontrado". O PDF é comprovante; a página pública é a prova de autenticidade.
- Schema: `Certificate` (`verificationHash @unique`, `@@unique(userId, courseId)`).

## Checklist

- [ ] Hash de verificação aleatório, nunca sequencial
- [ ] Emissão em fila (concorrência baixa — Puppeteer é pesado), nunca na requisição
- [ ] PDF em bucket; página de verificação pública e consultável
- [ ] Webhook Mux responde rápido e processa na fila (timeout curto do provedor)
