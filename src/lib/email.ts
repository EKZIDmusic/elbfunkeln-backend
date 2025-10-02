import nodemailer from 'nodemailer';
import { Order, OrderItem, Product, Address } from '@prisma/client';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Elbfunkeln <noreply@elbfunkeln.de>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  order: Order & {
    items: (OrderItem & { product: { name: string; images: string } })[];
    shippingAddress: Address;
  }
) {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${Number(item.price).toFixed(2)} €
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${Number(item.total).toFixed(2)} €
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bestellbestätigung</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Elbfunkeln</h1>
        <p style="color: white; margin: 10px 0 0 0;">Vielen Dank für Ihre Bestellung!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Bestellung #${order.orderNumber}</h2>
        
        <p>Hallo,</p>
        <p>wir haben Ihre Bestellung erhalten und werden sie schnellstmöglich bearbeiten.</p>
        
        <h3 style="color: #667eea; margin-top: 30px;">Bestelldetails</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 10px; text-align: left;">Artikel</th>
              <th style="padding: 10px; text-align: center;">Menge</th>
              <th style="padding: 10px; text-align: right;">Preis</th>
              <th style="padding: 10px; text-align: right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="border-top: 2px solid #667eea; padding-top: 20px; margin-top: 20px;">
          <table style="width: 100%; max-width: 300px; margin-left: auto;">
            <tr>
              <td style="padding: 5px;">Zwischensumme:</td>
              <td style="padding: 5px; text-align: right;">${Number(order.subtotal).toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="padding: 5px;">Versand:</td>
              <td style="padding: 5px; text-align: right;">${Number(order.shipping).toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="padding: 5px;">MwSt. (19%):</td>
              <td style="padding: 5px; text-align: right;">${Number(order.tax).toFixed(2)} €</td>
            </tr>
            ${
              Number(order.discount) > 0
                ? `
            <tr>
              <td style="padding: 5px; color: #27ae60;">Rabatt:</td>
              <td style="padding: 5px; text-align: right; color: #27ae60;">-${Number(order.discount).toFixed(2)} €</td>
            </tr>
            `
                : ''
            }
            <tr style="font-weight: bold; font-size: 18px; border-top: 2px solid #667eea;">
              <td style="padding: 10px 5px;">Gesamt:</td>
              <td style="padding: 10px 5px; text-align: right; color: #667eea;">${Number(order.total).toFixed(2)} €</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #667eea; margin-top: 30px;">Lieferadresse</h3>
        <p style="margin: 10px 0;">
          ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.zip} ${order.shippingAddress.city}<br>
          ${order.shippingAddress.country}
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin-top: 30px; border-left: 4px solid #667eea;">
          <p style="margin: 0;"><strong>Status:</strong> ${getStatusText(order.status)}</p>
          <p style="margin: 10px 0 0 0;"><strong>Zahlungsstatus:</strong> ${getPaymentStatusText(order.paymentStatus)}</p>
        </div>
        
        <p style="margin-top: 30px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        
        <p style="margin-top: 30px;">
          Mit freundlichen Grüßen<br>
          Ihr Elbfunkeln Team
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Elbfunkeln - Handgemachter Drahtschmuck</p>
        <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Bestellbestätigung - ${order.orderNumber}`,
    html,
  });
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(
  email: string,
  orderNumber: string,
  trackingNumber: string
) {
  const trackingUrl = `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${trackingNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ihre Bestellung wurde versendet</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📦 Ihre Bestellung ist unterwegs!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Gute Nachrichten! Ihre Bestellung <strong>${orderNumber}</strong> wurde soeben versendet.</p>
        
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0;"><strong>Sendungsnummer:</strong></p>
          <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">${trackingNumber}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" 
             style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Sendung verfolgen
          </a>
        </div>
        
        <p>Ihr Paket sollte in den nächsten 2-3 Werktagen bei Ihnen eintreffen.</p>
        
        <p style="margin-top: 30px;">
          Mit freundlichen Grüßen<br>
          Ihr Elbfunkeln Team
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Elbfunkeln - Handgemachter Drahtschmuck</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Ihre Bestellung ${orderNumber} wurde versendet`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Passwort zurücksetzen</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Passwort zurücksetzen</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Passwort zurücksetzen
          </a>
        </div>
        
        <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
        <p style="background: white; padding: 15px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
        
        <p><strong>Dieser Link ist 1 Stunde gültig.</strong></p>
        
        <p style="margin-top: 30px; color: #e74c3c;">
          Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
        </p>
        
        <p style="margin-top: 30px;">
          Mit freundlichen Grüßen<br>
          Ihr Elbfunkeln Team
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Passwort zurücksetzen - Elbfunkeln',
    html,
  });
}

/**
 * Helper: Get status text in German
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Ausstehend',
    PROCESSING: 'In Bearbeitung',
    SHIPPED: 'Versendet',
    DELIVERED: 'Zugestellt',
    CANCELLED: 'Storniert',
    REFUNDED: 'Erstattet',
  };
  return statusMap[status] || status;
}

/**
 * Helper: Get payment status text in German
 */
function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Ausstehend',
    COMPLETED: 'Bezahlt',
    FAILED: 'Fehlgeschlagen',
    REFUNDED: 'Erstattet',
  };
  return statusMap[status] || status;
}