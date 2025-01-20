import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(recipient, subject, message) {
  // Split the recipient string by commas to handle multiple recipients
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const recipientsArray = recipient.split(',').map(email => email.trim()).filter(isValidEmail);
  
  if (recipientsArray.length === 0) {
    console.error('No valid email addresses found.');
    return; // Prevent sending if no valid emails
  }
  // Create the msg object for SendGrid
  const msg = {
    to: recipientsArray.map(email => ({ email })),
    from: 'deividaslitvinenko4@gmail.com',
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response); // Log the full response
  } catch (error) {
    console.error('SendGrid error:', error.response ? error.response.body : error);
  }
  

  try {
    // Send email via SendGrid
    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error.response.body);
  }
}
