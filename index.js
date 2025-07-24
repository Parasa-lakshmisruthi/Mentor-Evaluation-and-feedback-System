const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const ses = new SESClient({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });

const mentorEmails = {
  "B.Harsha": "sruthiparasa5@gmail.com",
  "K.SuryaNarayana": "sruthiparasa16@gmail.com",
  "S.Durga Prasad": "sruthiparasa@gmail.com",
  "Siva Sankar Ramadev": "arunakumariparasa649@gmail.com"
};

const createEmailBody = (mentorName, feedback) => {
  const currentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  let ratingsHtml = '';
  let commentsHtml = '';

  for (const [key, value] of Object.entries(feedback)) {
    if (key === 'Additional Comments' || key === 'Personal Message') {
      if (value && value.trim()) {
        commentsHtml += `
          <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff;">
            <strong>${key}:</strong><br><em>"${value.trim()}"</em>
          </div>`;
      }
    } else {
      const rating = parseInt(value) || 0;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      ratingsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${key}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${rating}/5</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; color: #ffc107;">${stars}</td>
        </tr>`;
    }
  }

  return `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff;">📋 Mentor Feedback Report</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Mentor:</strong> ${mentorName}</p>
        <p><strong>Date & Time:</strong> ${currentDate}</p>
      </div>
      <h3>Rating Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background: #007bff; color: white;">
            <th style="padding: 12px; text-align: left;">Evaluation Criteria</th>
            <th style="padding: 12px; text-align: center;">Rating</th>
            <th style="padding: 12px; text-align: center;">Visual Rating</th>
          </tr>
        </thead>
        <tbody>${ratingsHtml}</tbody>
      </table>
      ${commentsHtml ? `<h3 style="margin-top: 30px;">Additional Comments</h3>${commentsHtml}` : ''}
      <div style="margin-top: 40px; padding: 15px; background: #e9ecef; text-align: center;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated message from the Mentor Evaluation System. Please do not reply.
        </p>
      </div>
    </body>
    </html>`;
};

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    let parsedBody;
    try {
      parsedBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON format", error: parseError.message })
      };
    }

    const { mentorName, feedback } = parsedBody || {};
    if (!mentorName || typeof mentorName !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ message: "mentorName is required" }) };
    }
    if (!feedback || typeof feedback !== 'object') {
      return { statusCode: 400, body: JSON.stringify({ message: "feedback must be an object" }) };
    }

    const email = mentorEmails[mentorName];
    if (!email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Mentor not found: ${mentorName}`, availableMentors: Object.keys(mentorEmails) })
      };
    }

    // Store feedback in DynamoDB
    const itemToPut = {
      MentorName: { S: mentorName },
      timestamp: { S: new Date().toISOString() }
    };

    const ratingKeys = [
      "Punctuality", "Clarity in concepts", "Availability", "Motivation",
      "Communication", "Understanding issues", "Career guidance",
      "Follow-up", "Project support", "Overall experience"
    ];

    let total = 0, count = 0;
    for (const key of ratingKeys) {
      const val = parseInt(feedback[key]);
      if (!isNaN(val)) {
        itemToPut[key.replace(/ /g, '')] = { N: val.toString() };
        total += val;
        count++;
      }
    }

    if (feedback["Additional Comments"]?.trim()) {
      itemToPut.AdditionalComments = { S: feedback["Additional Comments"].trim() };
    }
    if (feedback["Personal Message"]?.trim()) {
      itemToPut.PersonalMessage = { S: feedback["Personal Message"].trim() };
    }
    if (count > 0) {
      itemToPut.AverageRatingForSubmission = { N: (total / count).toFixed(2) };
    }

    try {
      await ddb.send(new PutItemCommand({ TableName: "MentorFeedback", Item: itemToPut }));
      console.log("DynamoDB: Feedback saved successfully.");
    } catch (dbError) {
      console.error("DynamoDB Error:", dbError);
    }

    // Send email via SES
    const emailParams = {
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `📝 New Feedback Report - ${mentorName}` },
        Body: {
          Html: { Charset: "UTF-8", Data: createEmailBody(mentorName, feedback) }
        }
      },
      Source: process.env.SOURCE_EMAIL || "sruthiparasa5@gmail.com"
    };

    try {
      const response = await ses.send(new SendEmailCommand(emailParams));
      console.log("Email sent. Message ID:", response.MessageId);
    } catch (sesError) {
      console.error("SES Error:", sesError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Feedback submitted and processed successfully.",
        mentor: mentorName,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Unhandled error:", error);
    const statusCode = error.name === 'MessageRejected' ? 400 :
                       error.name === 'SendingQuotaExceededException' ? 429 : 500;
    const message = error.name === 'MessageRejected' ? "SES rejected the email." :
                    error.name === 'SendingQuotaExceededException' ? "SES sending quota exceeded." :
                    "Internal server error.";
    return {
      statusCode,
      body: JSON.stringify({ message, error: error.message, timestamp: new Date().toISOString() })
    };
  }
};
