// llmIntegration.js

// Global conversation history (last 20 messages)
let conversationHistory = [];

async function updateHtmlWithLLM() {
  const userPrompt = document.getElementById("prompt").value.trim();
  const currentHtml = window.editor.getValue();
  
  // Announce the start of processing.
  speak("Processing your request.");
  
  // Updated system message for snippet-based editing
  const systemMessage =
    "You are an HTML code editor and accessible assistant. When given a user instruction and an HTML snippet, update the HTML according to the instruction if needed. " +
    "Always respond in exactly the following format, with no additional text, commentary, or markdown formatting:\n\n" +
    "Voice narration: <a short, concise narration message in clear simple language, suitable for a visually impaired user>\n" +
    "HTML: <the updated HTML code snippet; if no changes are needed, leave this section empty>\n\n" +
    "Important: Only return the HTML snippet that will replace the current content. DO NOT include any DOCTYPE, html, head, or body tags. " +
    "The user is editing just a portion of content inside a div, not a complete HTML document.\n\n" +
    "This content is styled using bootstrap. Always use standard bootstrap classes and components. Never use custom css or js. " +
    "Do not mention this or any technicalities of implementation to the user." +
    "If user asks what they are looking at or to describe the content, describe the content as a document. " +
    "When the user says 'title' they expect a visible title in the document, something that gets added with <h1> at the top of the content." +
    "Do not add sample content unless explicitly asked. The user is visually impaired and expects you to do only what you have been told. " +
    "Make sure you inform exactly what has changed in the document in the voice narration.";
  
  const newUserMessage = { 
    role: "user", 
    content: `Instruction: ${userPrompt}\n\nHTML CODE:\n${currentHtml}` 
  };

  // Build messages array including conversation history.
  const messages = [
    { role: "system", content: systemMessage },
    ...conversationHistory,
    newUserMessage
  ];

  // Get LLM credentials from settings modal.
  const llmEndpoint = document.getElementById("llmEndpoint").value.trim();
  const llmApiKey = document.getElementById("llmApiKey").value.trim();
  const llmDeploymentName = document.getElementById("llmDeploymentName").value.trim();
  
  if (!llmEndpoint || !llmApiKey) {
    alert("Please provide LLM API credentials in the Settings modal.");
    return;
  }
  
  const llmConfig = {
    endpoint: llmEndpoint,
    apiKey: llmApiKey,
    deploymentName: llmDeploymentName
  };

  const payload = {
    messages: messages,
    max_tokens: 2048,
    temperature: 0.0
  };

  try {
    const response = await fetch(llmConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": llmConfig.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const answer = data.choices[0].message.content.trim();

    // Parse expected format:
    // Voice narration: <narration text>
    // HTML: <html code>
    const parts = answer.split(/HTML:\s*/);
    if (parts.length < 2) {
      throw new Error("LLM response does not follow the required format.");
    }
    const voiceNarration = parts[0].replace(/^Voice narration:\s*/i, "").trim();
    let htmlPart = parts[1].trim();

    // Remove any markdown formatting.
    htmlPart = htmlPart.replace(/^```(?:html)?/i, "").replace(/```$/i, "").trim();

    // Add new messages to conversation history.
    const assistantMessage = { role: "assistant", content: answer };
    conversationHistory.push(newUserMessage, assistantMessage);
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    if (voiceNarration) {
      speak(voiceNarration);
    }
    if (htmlPart) {
      window.editor.setValue(htmlPart);
    }
  } catch (error) {
    console.error("Error during LLM update:", error);
    speak("An error occurred while processing your request.");
    alert("Error updating HTML code via LLM: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("submitBtn").addEventListener("click", function(e) {
    e.preventDefault();
    updateHtmlWithLLM();
  });
});
