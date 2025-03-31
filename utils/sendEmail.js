import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(recipient, subject, message) {
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Process multiple emails correctly
  const recipientsArray = recipient
    .split(',')
    .map(email => email.trim())
    .filter(isValidEmail);

  if (recipientsArray.length === 0) {
    console.error('❌ No valid email addresses found.');
    return; 
  }

  const msg = {
    to: recipientsArray,  // ✅ SendGrid expects an array of emails
    from: 'Užimtumo tarnyba', 
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
  }
}
