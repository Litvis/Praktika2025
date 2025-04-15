import sgMail from '@sendgrid/mail';

// Set up SendGrid API key
const setupSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SendGrid API key is missing");
    throw new Error('Email service configuration error');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
};

// Helper function to validate emails
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Function to send email
export const sendEmail = async (recipient, subject, message, attachments = []) => {
  try {
    setupSendGrid();
    
    // Validate recipient email(s)
    const recipientsArray = recipient
      ? recipient.split(',').map(email => email.trim()).filter(isValidEmail)
      : [];

    if (recipientsArray.length === 0) {
      throw new Error('No valid recipient email addresses found');
    }

    console.log(`📧 Sending email to ${recipientsArray.length} recipients`);
    
    // Batch recipients if there are too many (SendGrid has limits)
    const BATCH_SIZE = 100; // SendGrid recommends batching for large recipient lists
    const batches = [];
    
    for (let i = 0; i < recipientsArray.length; i += BATCH_SIZE) {
      batches.push(recipientsArray.slice(i, i + BATCH_SIZE));
    }
    
    const results = [];
    
    // Process each batch
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

      // Add attachments if they exist
      if (attachments && attachments.length > 0) {
        msg.attachments = attachments.map(attachment => ({
          content: attachment.content, // Base64 content
          filename: attachment.filename,
          type: attachment.type,
          disposition: attachment.disposition || 'attachment',
          content_id: attachment.content_id ? `<${attachment.content_id}>` : undefined
        }));
      }

      // Send email via SendGrid and collect response
      const [response] = await sgMail.send(msg);
      results.push(response);
      
      // Log batch results
      console.log(`✅ Batch ${i+1} sent successfully with status code: ${response.statusCode}`);
      
      // Optional: Add a small delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: true,
      message: `Email sent to ${recipientsArray.length} recipients`,
      results: results
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