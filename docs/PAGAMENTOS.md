# Pagamentos

## Princípio nº 1

**Acesso é liberado pelo webhook, nunca pela tela de sucesso.** O usuário pode fechar a aba ou o pagamento (Pix/boleto) pode confirmar horas depois. `checkout/sucesso` é só mensagem amigável.

## Stripe — pagamento único

- `POST api/checkout/stripe` — busca o curso **no banco**, cria Checkout Session `mode: payment` (moeda em centavos), `metadata {userId, courseId}`.
- `POST api/webhooks/stripe` — valida `stripe-signature` (`constructEvent`; 400 se inválida) → `checkout.session.completed`:
  - `mode === "subscription"` → cria `Subscription` (ver Assinaturas).
  - senão: idempotência via `gatewayChargeId` → `$transaction([payment.create(PAID), enrollment.upsert(ACTIVE)])` → `queueWelcomeEmail()`.

## Mercado Pago — pagamento único

- `POST api/checkout/mercadopago` — cria Preference (`unit_price = priceCents/100`, `currency_id: BRL`), `metadata`, `back_urls`, `notification_url`.
- `POST api/webhooks/mercadopago` — o webhook é só um aviso: **busca o pagamento real** (`mpPaymentClient.get`) e só prossegue se `status === "approved"` (Pix pendente → responde 200 sem criar matrícula). Mapeia `payment_type_id` → `PIX`/`BOLETO`/`CARD`; idempotência + transação iguais às da Stripe. `external_reference` no formato `userId:planId` indica pagamento de assinatura (estende `currentPeriodEnd` +30d).

## Assinaturas recorrentes

Modelos: `Plan` (preço, `MONTHLY|YEARLY`, `stripePriceId`/`mpPreapprovalPlanId`, `isAllCourses` + N:N `PlanCourse`) e `Subscription` (`ACTIVE|PAST_DUE|CANCELED|EXPIRED`, `gatewaySubscriptionId @unique`).

- Stripe: `api/checkout/stripe/subscription` (`mode: subscription`) + eventos no mesmo webhook: `checkout.session.completed` (cria), `invoice.paid` (estende período), `invoice.payment_failed` (→ `PAST_DUE` + email de cobrança), `customer.subscription.deleted` (→ `CANCELED` + `canceledAt`).
- MP: `api/checkout/mercadopago/subscription` (Preapproval mensal em BRL).
- Regras: tolerância antes de cortar (`PAST_DUE`, ~3–5 dias); cancelamento mantém acesso até `currentPeriodEnd`.

## Diferenças Stripe × MP

| | Stripe | Mercado Pago |
|---|---|---|
| Webhook | já vem completo e assinado | só avisa — buscar pagamento na API |
| Pix/boleto | não nativo | nativo (boleto pode levar dias) |
| Moeda | centavos | decimal |
| Segurança | `stripe-signature` | validar `x-signature` (HMAC) em produção |
| Uso | internacional, recorrência | Brasil, Pix converte mais |

## Checklist

- [ ] Assinatura de todo webhook validada antes de processar
- [ ] `payment + enrollment` em `$transaction`
- [ ] Preço sempre do banco, nunca do frontend
- [ ] Idempotência (`gatewayChargeId` único + checagem prévia)
- [ ] Webhooks logados (inclusive inválidos) p/ auditoria
- [ ] Sandbox/teste dos dois gateways antes de produção; staging com chaves de teste
