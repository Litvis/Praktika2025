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

  const personalizations = recipientsArray.map(email => ({
    to: [{ email }],
    subject: subject
  }));
  
  const msg = {
    personalizations: personalizations,
    from: {
      email: 'deividaslitvinenko4@gmail.com',
      name: 'Užimtumo tarnyba'
    },
    content: [
      {
        type: 'text/plain',
        value: message.replace(/<[^>]*>/g, '')
      },
      {
        type: 'text/html',
        value: message
      }
    ]
  };
  try {
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
  }
}
