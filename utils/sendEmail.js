import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(recipient, subject, message) {
  // Split the recipient string by commas to handle multiple recipients
  const recipientsArray = recipient.split(',').map(email => email.trim());

  // Create the msg object for SendGrid
  const msg = {
    to: recipientsArray.map(email => ({ email })), // Map to array of objects with email key
    from: 'deividaslitvinenko4@gmail.com',
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    // Send email via SendGrid
    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error.response.body);
  }
}
