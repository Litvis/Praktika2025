import sgMail from '@sendgrid/mail';

const setupSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SendGrid API key is missing");
    throw new Error('Email service configuration error');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const sendEmail = async (recipient, subject, message, attachments = [], config = {}, userEmail = null, userName = null) => {
  const senderEmail = process.env.VERIFIED_SENDER_EMAIL || 'deividaslitvinenko4@gmail.com';
  
  const senderName = userName || config?.EMAIL_SENDER_NAME || process.env.EMAIL_SENDER_NAME || 'Užimtumo tarnyba';
  
  try {
    setupSendGrid();
    
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim()).filter(isValidEmail)
      : [];

    if (recipientsArray.length === 0) {
      throw new Error('No valid recipient email addresses found');
    }

    console.log(`📧 Sending email to ${recipientsArray.length} recipients`);
    console.log(`📧 Sender info: ${senderName} <${senderEmail}>`);
    if (userEmail) {
      console.log(`📧 Reply-To: ${userName || 'User'} <${userEmail}>`);
    }
    
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < recipientsArray.length; i += BATCH_SIZE) {
      batches.push(recipientsArray.slice(i, i + BATCH_SIZE));
    }
    
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📧 Processing batch ${i+1}/${batches.length} with ${batch.length} recipients`);
      
      const personalizations = batch.map(email => ({
        to: [{ email }],
        subject: subject
      }));
      
      const msg = {
        personalizations: personalizations,
        from: {
          email: senderEmail,
          name: senderName
        },
        ...(userEmail ? { replyTo: { email: userEmail, name: userName || 'User' } } : {}),
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

      if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type,
          disposition: attachment.disposition || 'attachment',
          content_id: attachment.content_id ? `<${attachment.content_id}>` : undefined
        }));
      }

      const [response] = await sgMail.send(msg);
      results.push(response);
      
      console.log(`✅ Batch ${i+1} sent successfully with status code: ${response.statusCode}`);
      
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: true,
      message: `Email sent to ${recipientsArray.length} recipients`,
      results: results,
      senderInfo: {
        email: senderEmail,
        name: senderName,
        replyTo: userEmail || null
      }
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    let errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      console.error('SendGrid API response statusCode:', error.response.statusCode);
      console.error('SendGrid API response body:', error.response.body);
      
      errorDetails.sendGridError = error.response.body;
      errorDetails.statusCode = error.response.statusCode;
    }
    
    throw errorDetails;
  }
};