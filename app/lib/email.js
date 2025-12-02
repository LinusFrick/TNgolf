import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_TYPES = {
  'golftraning': { name: 'Golfträning', description: 'Personlig golfträning för att förbättra ditt tekniska spel' },
  'mental-traning': { name: 'Mental träning (Golf & Mind)', description: 'Arbeta med din mentala styrka och fokus' },
  'gruppträning': { name: 'Gruppträning', description: 'Träna tillsammans med andra golfspelare' },
};

export async function sendBookingConfirmationEmail(booking, user, receiptUrl = null) {
  try {
    const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bokningsbekräftelse</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Tack för din bokning! 🏌️</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p>Hej ${user.name || 'där'}!</p>
            
            <p>Tack för att du har bokat en tid hos oss. Din bokning är bekräftad och betald.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">Bokningsinformation</h2>
              <p style="margin: 8px 0;"><strong>Tjänst:</strong> ${service.name}</p>
              <p style="margin: 8px 0;"><strong>Datum:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Tid:</strong> ${booking.time}</p>
              ${booking.amount ? `<p style="margin: 8px 0;"><strong>Belopp:</strong> ${booking.amount.toLocaleString('sv-SE')} kr</p>` : ''}
            </div>
            
            ${service.description ? `<p style="color: #6b7280; font-size: 14px;">${service.description}</p>` : ''}
            
            ${booking.notes ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>Dina anteckningar:</strong></p>
                <p style="margin: 8px 0 0 0;">${booking.notes}</p>
              </div>
            ` : ''}
            
            <p>Vi ser fram emot att träffa dig!</p>
            
            <p style="margin-top: 30px;">
              Med vänliga hälsningar,<br>
              <strong>Golfmind</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Detta är en automatisk bekräftelse.</p>
            <p style="margin: 10px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kvitto/${booking.id}" style="color: #2563eb; text-decoration: none; font-weight: 600; background-color: white; padding: 8px 16px; border-radius: 6px; display: inline-block; border: 1px solid #2563eb;">Se ditt kvitto →</a>
            </p>
            ${receiptUrl ? `
              <p style="margin: 10px 0 0 0; font-size: 11px;">
                Du kan också <a href="${receiptUrl}" style="color: #6b7280; text-decoration: underline;">ladda ner kvittot från Stripe</a>.
              </p>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    const emailText = `
Tack för din bokning! 🏌️

Hej ${user.name || 'där'}!

Tack för att du har bokat en tid hos oss. Din bokning är bekräftad och betald.

Bokningsinformation:
- Tjänst: ${service.name}
- Datum: ${dateStr}
- Tid: ${booking.time}
${booking.amount ? `- Belopp: ${booking.amount.toLocaleString('sv-SE')} kr` : ''}

${service.description ? `${service.description}\n` : ''}
${booking.notes ? `\nDina anteckningar:\n${booking.notes}\n` : ''}

Vi ser fram emot att träffa dig!

Med vänliga hälsningar,
Golfmind

---
Detta är en automatisk bekräftelse.

Se ditt kvitto: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kvitto/${booking.id}
${receiptUrl ? `\nAlternativt kan du ladda ner kvittot från Stripe: ${receiptUrl}` : ''}
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golfmind <noreply@golfmind.se>',
      to: user.email,
      subject: `Bokningsbekräftelse - ${service.name} ${dateStr}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Confirmation email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

export async function sendCancellationRequestEmail(booking, user) {
  try {
    const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const bookingDateTime = new Date(booking.date);
    const bookingTime = booking.time;
    const [hours, minutes] = bookingTime.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const cancellationDeadline = new Date(bookingDateTime);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 48);
    
    const now = new Date();
    const hoursUntilBooking = Math.floor((bookingDateTime - now) / (1000 * 60 * 60));
    // Since cancellation is only allowed if > 48h remain, all cancellation requests will be "free"
    const canCancelFree = hoursUntilBooking > 48;

    const adminEmail = process.env.COACH_EMAIL || process.env.ADMIN_EMAIL || 'admin@golfmind.se';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Avbokningsförfrågan</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h1 style="color: #92400e; margin-top: 0;">Avbokningsförfrågan ⚠️</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p>Hej!</p>
            
            <p>En kund har begärt att avboka sin bokning.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">Bokningsinformation</h2>
              <p style="margin: 8px 0;"><strong>Kund:</strong> ${user.name || 'Okänt'} (${user.email})</p>
              <p style="margin: 8px 0;"><strong>Tjänst:</strong> ${service.name}</p>
              <p style="margin: 8px 0;"><strong>Datum:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Tid:</strong> ${booking.time}</p>
              <p style="margin: 8px 0;"><strong>Boknings-ID:</strong> ${booking.id}</p>
              ${booking.amount ? `<p style="margin: 8px 0;"><strong>Belopp:</strong> ${booking.amount.toLocaleString('sv-SE')} kr</p>` : ''}
            </div>
            
            <div style="background-color: ${canCancelFree ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${canCancelFree ? '#10b981' : '#ef4444'};">
              <p style="margin: 0; font-weight: bold; color: ${canCancelFree ? '#065f46' : '#991b1b'};">
                ✅ Gratis avbokning möjlig (${hoursUntilBooking} timmar kvar till bokningen)
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #065f46;">
                Sista tidpunkt för avbokning: ${cancellationDeadline.toLocaleString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              Logga in på admin-panelen för att hantera avbokningen.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Avbokningsförfrågan ⚠️

Hej!

En kund har begärt att avboka sin bokning.

Bokningsinformation:
- Kund: ${user.name || 'Okänt'} (${user.email})
- Tjänst: ${service.name}
- Datum: ${dateStr}
- Tid: ${booking.time}
- Boknings-ID: ${booking.id}
${booking.amount ? `- Belopp: ${booking.amount.toLocaleString('sv-SE')} kr` : ''}

✅ Gratis avbokning möjlig (${hoursUntilBooking} timmar kvar till bokningen)

Sista tidpunkt för avbokning: ${cancellationDeadline.toLocaleString('sv-SE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Logga in på admin-panelen för att hantera avbokningen.
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golfmind <noreply@golfmind.se>',
      to: adminEmail,
      subject: `Avbokningsförfrågan - ${service.name} ${dateStr} ${booking.time}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Cancellation request email sent to admin:', result);
    return result;
  } catch (error) {
    console.error('Error sending cancellation request email:', error);
    throw error;
  }
}

export async function sendCancellationConfirmationEmail(booking, user) {
  try {
    const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bokning avbokad</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
            <h1 style="color: #991b1b; margin-top: 0;">Din bokning har avbokats</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p>Hej ${user.name || 'där'}!</p>
            
            <p>Din bokning har avbokats av admin.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">Bokningsinformation</h2>
              <p style="margin: 8px 0;"><strong>Tjänst:</strong> ${service.name}</p>
              <p style="margin: 8px 0;"><strong>Datum:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Tid:</strong> ${booking.time}</p>
              <p style="margin: 8px 0;"><strong>Boknings-ID:</strong> ${booking.id}</p>
            </div>
            
            <p>Om du har frågor eller vill boka en ny tid, vänligen kontakta oss.</p>
            
            <p style="margin-top: 30px;">
              Med vänliga hälsningar,<br>
              <strong>Golfmind</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Din bokning har avbokats

Hej ${user.name || 'där'}!

Din bokning har avbokats av admin.

Bokningsinformation:
- Tjänst: ${service.name}
- Datum: ${dateStr}
- Tid: ${booking.time}
- Boknings-ID: ${booking.id}

Om du har frågor eller vill boka en ny tid, vänligen kontakta oss.

Med vänliga hälsningar,
Golfmind
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golfmind <noreply@golfmind.se>',
      to: user.email,
      subject: `Bokning avbokad - ${service.name} ${dateStr}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Cancellation confirmation email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending cancellation confirmation email:', error);
    throw error;
  }
}

export async function sendNewBookingNotificationEmail(booking, user, receiptUrl = null) {
  try {
    const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const adminEmail = process.env.COACH_EMAIL || process.env.ADMIN_EMAIL || 'admin@golfmind.se';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ny bokning - Bekräftelse krävs</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h1 style="color: #1e40af; margin-top: 0;">Ny bokning - Bekräftelse krävs 📋</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p>Hej!</p>
            
            <p>En ny bokning har mottagits och betalning är klar. Bokningen väntar på din bekräftelse.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1f2937;">Bokningsinformation</h2>
              <p style="margin: 8px 0;"><strong>Kund:</strong> ${user.name || 'Okänt'} (${user.email})</p>
              <p style="margin: 8px 0;"><strong>Tjänst:</strong> ${service.name}</p>
              <p style="margin: 8px 0;"><strong>Datum:</strong> ${dateStr}</p>
              <p style="margin: 8px 0;"><strong>Tid:</strong> ${booking.time}</p>
              <p style="margin: 8px 0;"><strong>Boknings-ID:</strong> ${booking.id}</p>
              ${booking.amount ? `<p style="margin: 8px 0;"><strong>Belopp:</strong> ${booking.amount.toLocaleString('sv-SE')} kr</p>` : ''}
              <p style="margin: 8px 0;"><strong>Betalningsstatus:</strong> Betald ✓</p>
            </div>
            
            ${booking.notes ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>Kundens anteckningar:</strong></p>
                <p style="margin: 8px 0 0 0;">${booking.notes}</p>
              </div>
            ` : ''}
            
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-weight: bold; color: #065f46;">
                ⚠️ Viktigt: Logga in på admin-panelen för att bekräfta denna bokning.
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" style="color: #2563eb; text-decoration: none; font-weight: 600; background-color: #dbeafe; padding: 12px 24px; border-radius: 6px; display: inline-block; border: 1px solid #2563eb;">
                Gå till admin-panel →
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Ny bokning - Bekräftelse krävs 📋

Hej!

En ny bokning har mottagits och betalning är klar. Bokningen väntar på din bekräftelse.

Bokningsinformation:
- Kund: ${user.name || 'Okänt'} (${user.email})
- Tjänst: ${service.name}
- Datum: ${dateStr}
- Tid: ${booking.time}
- Boknings-ID: ${booking.id}
${booking.amount ? `- Belopp: ${booking.amount.toLocaleString('sv-SE')} kr` : ''}
- Betalningsstatus: Betald ✓

${booking.notes ? `\nKundens anteckningar:\n${booking.notes}\n` : ''}

⚠️ Viktigt: Logga in på admin-panelen för att bekräfta denna bokning.

Gå till admin-panel: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Golfmind <noreply@golfmind.se>',
      to: adminEmail,
      subject: `Ny bokning - Bekräftelse krävs: ${service.name} ${dateStr} ${booking.time}`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Admin notification email sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
}

