// llmIntegration.js

// Global conversation history array (stores user and assistant messages)
// We limit the history to the last 20 messages (excluding the system message).
let conversationHistory = [];

/**
 * updateHtmlWithLLM()
 * Constructs a conversation payload that includes the conversation history,
 * sends it to the LLM, parses the response, and then updates the editor and voice narration.
 */
async function updateHtmlWithLLM() {
  const userPrompt = document.getElementById("prompt").value.trim();
  const currentHtml = window.editor.getValue();

  // Announce the start of processing.
  speak("Processing your request.");

  // Define the strict system message (always included at the start).
  const systemMessage =
    "You are a strict HTML code editor and accessible assistant. When given a user instruction and an HTML code snippet, update the HTML code according to the instruction if needed. " +
    "Always respond in exactly the following format, with no additional text, commentary, or markdown formatting:\n\n" +
    "Voice narration: <a short, concise narration message in clear simple language, suitable for a visually impaired user>\n" +
    "HTML: <the updated HTML code; if no changes are needed, leave this section empty>\n\n" +
    "Always return the complete html code of the page and not just the specific snippet of change.\n\n" +
    "Do not include any markdown formatting (such as triple backticks) or any extra symbols.";

  // Construct the new user message including the current HTML.
  const newUserMessage = { 
    role: "user", 
    content: `Instruction: ${userPrompt}\n\nHTML CODE:\n${currentHtml}` 
  };

  // Build the complete messages array:
  // - Start with the system message.
  // - Append the conversation history (if any).
  // - Append the new user message.
  const messages = [
    { role: "system", content: systemMessage },
    ...conversationHistory,
    newUserMessage
  ];

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

    // Parse the answer. Expected format:
    // Voice narration: <narration text>
    // HTML: <html code>
    const parts = answer.split(/HTML:\s*/);
    if (parts.length < 2) {
      throw new Error("LLM response does not follow the required format.");
    }
    const voiceNarration = parts[0].replace(/^Voice narration:\s*/i, "").trim();
    let htmlPart = parts[1].trim();

    // Remove any markdown code block markers.
    htmlPart = htmlPart.replace(/^```(?:html)?/i, "").replace(/```$/i, "").trim();

    // Add the assistant's response to the conversation history.
    // We store the full raw response (you could store only the user or assistant parts if desired).
    const assistantMessage = { role: "assistant", content: answer };
    conversationHistory.push(newUserMessage, assistantMessage);

    // Limit conversation history to the last 20 messages.
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    // Use voice synthesis to narrate the voice narration part.
    if (voiceNarration) {
      speak(voiceNarration);
    }

    // If the HTML part is not empty, update the CodeMirror editor.
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
