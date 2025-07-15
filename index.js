const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({ region: "ap-south-1" });

const mentorEmails = {
  "B.Harsha": "sruthiparasa5@gmail.com",
  "K.SuryaNarayana": "sruthiparasa16@gmail.com",
  "S.Durga Prasad": "sruthiparasa@gmail.com",
  "Siva Sankar Ramadev": "arunakumariparasa649@gmail.com"
};

// ✅ Fixed CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));
  
  // ✅ Handle preflight OPTIONS request
  if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    // ✅ Parse request body safely
    let requestBody;
    try {
      requestBody = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: "error", 
          error: "Invalid JSON format" 
        })
      };
    }

    const { mentorName, feedback } = requestBody;
    console.log("Received data:", { mentorName, feedback });

    // ✅ Validate required fields
    if (!mentorName || !feedback) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: "error", 
          error: "Missing required data: mentorName and feedback are required" 
        })
      };
    }

    // ✅ Check if mentor email exists
    const email = mentorEmails[mentorName];
    if (!email) {
      console.error("Mentor not found:", mentorName);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: "error", 
          error: `Mentor email not found for: ${mentorName}` 
        })
      };
    }

    // ✅ Create better formatted email content
    const createEmailBody = (mentorName, feedback) => {
      const currentDate = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let ratingsHtml = '';
      let commentsHtml = '';

      Object.entries(feedback).forEach(([key, value]) => {
        if (key === 'Additional Comments' || key === 'Personal Message') {
          if (value && value.trim()) {
            commentsHtml += `
              <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff;">
                <strong>${key}:</strong><br>
                <em>"${value}"</em>
              </div>
            `;
          }
        } else {
          const stars = '★'.repeat(parseInt(value) || 0) + '☆'.repeat(5 - (parseInt(value) || 0));
          ratingsHtml += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${key}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${value}/5</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #ffc107; font-size: 18px;">${stars}</td>
            </tr>
          `;
        }
      });

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Mentor Feedback</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📝 Mentor Feedback Received</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Feedback for ${mentorName}</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #0066cc;"><strong>📅 Submitted on:</strong> ${currentDate}</p>
            </div>

            <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">📊 Ratings & Feedback</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #007bff;">Criteria</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #007bff;">Rating</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #007bff;">Stars</th>
                </tr>
              </thead>
              <tbody>
                ${ratingsHtml}
              </tbody>
            </table>

            ${commentsHtml}

            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>✅ This feedback has been successfully recorded in our system.</strong></p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated email from the Mentor Evaluation System</p>
          </div>
        </body>
        </html>
      `;
    };

    const htmlBody = createEmailBody(mentorName, feedback);

    // ✅ SES Email parameters
    const params = {
      Destination: { 
        ToAddresses: [email] 
      },
      Message: {
        Body: { 
          Html: { 
            Charset: "UTF-8", 
            Data: htmlBody 
          } 
        },
        Subject: { 
          Charset: "UTF-8", 
          Data: `📝 New Feedback Received - ${mentorName}` 
        }
      },
      Source: "sruthiparasa5@gmail.com"
    };

    console.log("Sending email to:", email);
    
    // ✅ Send email via SES
    const result = await ses.send(new SendEmailCommand(params));
    console.log("Email sent successfully:", result.MessageId);

    // ✅ Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: "success",
        messageId: result.MessageId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Lambda Error:", error);
    
    // ✅ Return detailed error response
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: "error", 
        error: error.message,
        errorType: error.name || "UnknownError",
        timestamp: new Date().toISOString()
      })
    };
  }
};
