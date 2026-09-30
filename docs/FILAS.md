# Filas assíncronas (BullMQ)

## Por quê

Email, PDF de certificado e reação a webhook de vídeo são lentos ou dependem de serviço externo. Sem fila, rodam dentro da requisição HTTP (tela trava, sem retry). Com fila: resposta imediata + processamento em background com retry automático.

## As 3 filas (`lib/queue/queues.ts`)

| Fila | Concorrência | Tentativas | Motivo |
|---|---|---|---|
| `email` | 10 | 5 + backoff exponencial (5s…) | leve, mas serviço externo oscila |
| `certificate` | 3 | 3 + backoff | Puppeteer consome CPU/memória |
| `video-processing` | 5 | 5 | só reage a webhooks, precisa aguentar pico |

Jobs falhos ficam retidos (`removeOnFail: false` no email) para investigação.

## Producers (`lib/queue/producers/`)

- `queueWelcomeEmail(userId, courseId)` / `queuePaymentFailedEmail()` — chamados nos webhooks de pagamento.
- `queueCertificateCheck()` — `jobId: cert-{userId}-{courseId}`: o BullMQ **não duplica** o job (aluno conclui a última aula 2×, só um job).
- Webhook Mux: `videoQueue.add("mux-event", event)` — responde 200 na hora.

## Workers (`workers/`)

- `email.worker.ts` — `welcome-email`, `payment-failed-email`, `password-reset-email`, `certificate-issued-email` via Resend; no `failed` após esgotar tentativas, grava `FailedJob` (dead letter).
- `certificate.worker.ts` — `issueCertificateIfEligible()`; se emitiu, enfileira o email. Retornar `null` (aluno incompleto) não é erro.
- `video.worker.ts` — `video.asset.ready` atualiza `videoAssetId`; `errored` loga p/ avisar o instrutor.
- `index.ts` — ponto de entrada único (`import` dos três).

## Rodando

```powershell
npm run dev:workers    # dev (tsx watch)
npm run start:workers  # prod — Railway/Render como processo de background
```

Workers **nunca** rodam dentro do Next serverless — processo Node persistente com acesso ao mesmo Redis. Redis **com persistência** (compose usa `appendonly yes`); Redis só-de-cache perde jobs no restart.

## Monitoramento (`workers/dashboard.ts`)

Bull Board em `:3001/admin/queues` (pendentes, falhos, completos). **Proteger com auth antes de expor** — mostra emails e IDs. `FailedJob` vira tela no admin ("falhas definitivas") para reprocesso manual/investigação.

## Checklist

- [ ] Workers em processo separado do web
- [ ] `jobId` fixo onde não pode duplicar
- [ ] `attempts` + backoff em tudo que depende de serviço externo
- [ ] Bull Board autenticado, nunca público
- [ ] Falhas definitivas em tabela própria
- [ ] Redis persistente
