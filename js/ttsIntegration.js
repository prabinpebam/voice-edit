// ttsIntegration.js

/**
 * speak(message)
 * Uses Azure Speech SDK to synthesize speech.
 * It retrieves the subscription key and region from the "key" and "regionOptions" fields.
 */
function speak(message) {
    const keyElem = document.getElementById("key");
    const regionElem = document.getElementById("regionOptions");
  
    if (!keyElem || !regionElem || !keyElem.value || !regionElem.value) {
      console.error("TTS cannot run because subscription key or region is missing.");
      return;
    }
  
    // Create speech configuration using the same credentials.
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(keyElem.value, regionElem.value);
    // Optionally, set a preferred voice:
    // speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
  
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
  
    synthesizer.speakTextAsync(
      message,
      function (result) {
        console.log("TTS synthesis finished:", result);
        synthesizer.close();
      },
      function (err) {
        console.error("TTS synthesis error:", err);
        synthesizer.close();
      }
    );
  }
  