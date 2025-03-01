# HTML Editor & Accessible Assistant

This project is a web-based HTML editor and previewer integrated with advanced voice interaction and language model assistance. It is designed with accessibility in mind, especially for visually impaired users. The application allows users to modify HTML code in a rich code editor, receive voice narration and feedback, and interact with a cloud-hosted language model to update or answer queries about the HTML content.

## Features

- **Live HTML Editing and Previewing**  
  Modify HTML code using a CodeMirror-based editor with syntax highlighting and view a live preview of the rendered output in real time.

- **Speech Recognition and Voice Commands**  
  Use Azure Cognitive Services Speech SDK to provide hands-free interaction. Users can hold down the spacebar to start listening for input and release it to automatically submit the recognized prompt.

- **Centralized Text-to-Speech (TTS) Feedback**  
  All voice narration is provided via the Azure Speech SDK’s TTS functionality, ensuring consistent, high-quality audio feedback. This includes audible cues during listening, processing, and after successful updates or query responses.

- **LLM Integration for HTML Updates**  
  The application connects to a cloud-hosted language model that processes user instructions. The LLM is strictly instructed to respond in a two-part format:
  - A **Voice narration** part that provides a brief, accessible explanation or confirmation.
  - An **HTML** part that contains the complete updated HTML code (or is left empty if no changes are required).

- **Conversation Memory**  
  The system maintains a history of the last 20 interactions, allowing the language model to use recent context to generate more accurate and contextually relevant responses.

- **Accessibility Enhancements**  
  Designed specifically for visually impaired users, the app provides clear and concise audible feedback, including background sounds during active listening, and confirms actions verbally at every stage.

## Folder Structure

- **index.html**  
  The main entry point containing the user interface, including the code editor, live preview, and controls for voice input and settings.

- **css/**  
  Contains all custom styles for the project (layout, CodeMirror customizations, button styles, etc.).

- **js/**  
  - **app/**
    - `script.js` – Core UI initialization, CodeMirror setup, and two-way binding between the editor and preview.
    - `azureVoice.js` – Azure Speech Recognition integration including microphone management and event handling.
    - `ttsIntegration.js` – Centralized Text-to-Speech implementation using the Azure Speech SDK for all voice narration.
    - `llmIntegration.js` – LLM integration module that constructs prompts, maintains conversation history, and updates the editor based on responses.
  - `llmCredentials.js` – Stores sensitive credentials for the language model (this file should be excluded from version control via .gitignore).

- **audio/**  
  Contains audio assets such as the background listening sound used during active voice input.

- **server/**  
  Contains server-side scripts (e.g., `token.php`) for securely retrieving authorization tokens.

## Getting Started

1. **Clone the Repository:**  
   Clone the project to your local machine.

2. **Set Up Credentials:**  
   Obtain an Azure Cognitive Services subscription and configure the subscription key and region in the settings. Ensure that the `llmCredentials.js` file contains the proper credentials for the language model, and that it is excluded from version control.

3. **Configure .gitignore:**  
   Create a `.gitignore` file in the project root to exclude sensitive files and unnecessary artifacts.

4. **Run the Application:**  
   Open `index.html` in a modern web browser. Use the interface or hold down the spacebar for voice input and follow the audible instructions provided by the app.

## Accessibility

Special attention has been given to ensure that the application is fully accessible:
- **Voice Feedback:** Every action, from starting to listen, processing a request, to confirming an update, is announced audibly.
- **Simple Interaction:** The app uses a minimalistic and clear UI along with voice commands, reducing the reliance on visual cues.
- **Conversation History:** Maintaining recent interactions helps provide better contextual responses from the language model.

## Contributing

Contributions are welcome. Please ensure that any new features adhere to the project’s modular structure and maintain a high standard of accessibility. Updates should be accompanied by relevant documentation.

## License

This project is licensed under the MIT License. Please refer to the LICENSE file for further details.

## Acknowledgements

- **Azure Cognitive Services Speech SDK** – For speech recognition and text-to-speech capabilities.
- **OpenAI GPT-4o** – For language model integration that powers the HTML update assistant.
- **CodeMirror** – For providing a robust, feature-rich code editing environment.
