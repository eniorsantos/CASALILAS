import * as WebBrowser from "expo-web-browser";
import { api, webUrl } from "../api/client";

/**
 * Checkout via navegador do sistema (spec §9 — recomendado p/ MVP):
 * cria a preferência no backend e abre fora do app (expo-web-browser),
 * evitando comissão e rejeição por IAP embutido.
 */
export async function openCheckoutInBrowser(courseId: string): Promise<void> {
  try {
    const data = await api.post<{ url: string }>("/api/checkout/mercadopago", { courseId });
    if (data.url) {
      await WebBrowser.openBrowserAsync(data.url);
      return;
    }
  } catch {
    // cai para a página web de checkout (login por cookie no navegador)
  }
  const course = await api.get<{ slug: string }>(`/api/mobile/courses/by-id/${courseId}`);
  await WebBrowser.openBrowserAsync(webUrl(`/checkout/${course.slug}`));
}
