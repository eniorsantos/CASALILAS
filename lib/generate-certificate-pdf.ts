import { prisma } from "./prisma";

export async function generateCertificatePdf({
  userId,
  courseId,
  verificationHash,
}: {
  userId: string;
  courseId: string;
  verificationHash: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });

  const html = `
    <html>
      <body style="font-family: Georgia, serif; text-align: center; padding: 100px;">
        <h1 style="font-size: 20px; letter-spacing: 4px; color: #888;">CERTIFICADO DE CONCLUSÃO</h1>
        <p style="font-size: 18px; margin-top: 60px;">Certificamos que</p>
        <h2 style="font-size: 36px; margin: 20px 0;">${user.name}</h2>
        <p style="font-size: 18px;">concluiu com êxito o curso</p>
        <h3 style="font-size: 28px; margin: 20px 0;">${course.title}</h3>
        <p style="margin-top: 80px; font-size: 12px; color: #999;">
          Verifique a autenticidade em: ${process.env.APP_URL}/certificados/verificar/${verificationHash}
        </p>
      </body>
    </html>
  `;

  // Em serverless (Vercel), usar @sparticuz/chromium + puppeteer-core
  const isServerless = !!process.env.VERCEL;
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: "A4", landscape: true, printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4", landscape: true, printBackground: true });
  await browser.close();
  return Buffer.from(pdfBuffer);
}
