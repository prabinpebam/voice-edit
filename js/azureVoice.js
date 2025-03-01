// azureVoice.js

// Global variables
let recognizer = null;
let isRecognizing = false;
let authorizationToken = null;
let SpeechSDK;
let audioFile = null;

// Request an authorization token from token.php
function RequestAuthorizationToken() {
  const authorizationEndpoint = "token.php";
  if (authorizationEndpoint) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", authorizationEndpoint);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("");
    xhr.onload = function () {
      try {
        const tokenPayload = JSON.parse(atob(xhr.responseText.split(".")[1]));
        document.getElementById("regionOptions").value = tokenPayload.region;
        authorizationToken = xhr.responseText;
        document.getElementById("key").disabled = true;
        document.getElementById("key").value = "using authorization token (hit F5 to refresh)";
        console.log("Got an authorization token: ", tokenPayload);
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }
  }
}

// Initialize Speech SDK once loaded
function InitializeSpeechSDK(callback) {
  if (window.SpeechSDK) {
    callback(window.SpeechSDK);
  } else {
    console.error("Speech SDK not loaded.");
  }
}

// Get audio configuration from settings
function getAudioConfig() {
  if (audioFile) {
    return SpeechSDK.AudioConfig.fromWavFileInput(audioFile);
  } else if (document.getElementById("inputSourceFileRadio").checked) {
    alert('Please choose a file when selecting file input as your audio source.');
    return null;
  } else {
    const micSelect = document.getElementById("microphoneSources");
    if (micSelect && micSelect.value) {
      return SpeechSDK.AudioConfig.fromMicrophoneInput(micSelect.value);
    } else {
      return SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    }
  }
}

// Get speech configuration using settings
function getSpeechConfig() {
  const keyElem = document.getElementById("key");
  const regionElem = document.getElementById("regionOptions");
  const langElem = document.getElementById("languageOptions");
  const useDetailedResults = document.querySelector('input[name="formatOption"]:checked').value === "Detailed";
  let speechConfig;
  if (authorizationToken) {
    speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, regionElem.value);
  } else if (!keyElem.value || keyElem.value === "") {
    alert("Please enter your Cognitive Services Speech subscription key!");
    return null;
  } else {
    speechConfig = SpeechSDK.SpeechConfig.fromSubscription(keyElem.value, regionElem.value);
  }
  if (useDetailedResults) {
    speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;
  }
  speechConfig.speechRecognitionLanguage = langElem.value;
  return speechConfig;
}

// Final recognized result handler (only this updates the prompt)
function onRecognized(sender, recognitionEventArgs) {
  const result = recognitionEventArgs.result;
  const promptElem = document.getElementById("prompt");
  if (result.text) {
    promptElem.value = result.text;
  }
}

// Event handler for canceled recognition
function onCanceled(sender, cancellationEventArgs) {
  console.log("Recognition canceled:", cancellationEventArgs);
  stopRecognition();
}

// Event handler when a recognition session starts
function onSessionStarted(sender, sessionEventArgs) {
  console.log("Session started:", sessionEventArgs);
}

// Event handler when a recognition session stops
function onSessionStopped(sender, sessionEventArgs) {
  console.log("Session stopped:", sessionEventArgs);
  stopRecognition();
}

// Start recognition based on the selected scenario
// ... within azureVoice.js ...
function startRecognition() {
    const audioConfig = getAudioConfig();
    const speechConfig = getSpeechConfig();
    if (!audioConfig || !speechConfig) return;
    // (Assume using continuous mode for this example)
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognized = onRecognized;
    recognizer.canceled = onCanceled;
    recognizer.sessionStarted = onSessionStarted;
    recognizer.sessionStopped = onSessionStopped;
    recognizer.startContinuousRecognitionAsync();
    isRecognizing = true;
    window.isRecognizing = true;
    document.getElementById("micBtn").classList.add("listening");
  }
  
  function stopRecognition() {
    if (recognizer) {
      if (recognizer.stopContinuousRecognitionAsync) {
        recognizer.stopContinuousRecognitionAsync(function() {
          recognizer.close();
          recognizer = null;
          isRecognizing = false;
          window.isRecognizing = false;
          document.getElementById("micBtn").classList.remove("listening");
          // Stop any listening sound if playing
          const ls = document.getElementById("listeningSound");
          ls.pause();
          ls.currentTime = 0;
        });
      } else {
        recognizer.close();
        recognizer = null;
        isRecognizing = false;
        window.isRecognizing = false;
        document.getElementById("micBtn").classList.remove("listening");
        const ls = document.getElementById("listeningSound");
        ls.pause();
        ls.currentTime = 0;
      }
    }
  }
  
  window.startRecognition = startRecognition;
  window.stopRecognition = stopRecognition;
  

// Toggle recognition on mic button click
function toggleRecognition() {
  if (isRecognizing) {
    stopRecognition();
  } else {
    // Clear the prompt field before starting a new recognition session
    document.getElementById("prompt").value = "";
    startRecognition();
  }
}

// Enumerate available microphones and populate the dropdown
function enumerateMicrophones() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("Unable to enumerate audio devices.");
    return;
  }
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const micSelect = document.getElementById("microphoneSources");
    if (!micSelect) return;
    micSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.text = "Default Microphone";
    defaultOption.value = "";
    micSelect.add(defaultOption);
    devices.forEach(device => {
      if (device.kind === "audioinput") {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label || "Microphone " + (micSelect.options.length);
        micSelect.add(option);
      }
    });
    micSelect.disabled = (micSelect.options.length === 1);
  });
}

// Save speech settings to local storage
function saveSettings() {
  const settings = {
    key: document.getElementById("key").value,
    region: document.getElementById("regionOptions").value,
    language: document.getElementById("languageOptions").value,
    inputSource: document.querySelector('input[name="inputSourceOption"]:checked').value,
    scenario: document.getElementById("scenarioSelection").value,
    format: document.querySelector('input[name="formatOption"]:checked').value,
    languageTarget: document.getElementById("languageTargetOptions").value,
    voiceOutput: document.getElementById("voiceOutput").checked,
    appId: document.getElementById("appId").value,
    phrases: document.getElementById("phrases").value,
    referenceText: document.getElementById("referenceText").value
  };
  localStorage.setItem("speechSettings", JSON.stringify(settings));
}

// Load speech settings from local storage
function loadSettings() {
  const settings = localStorage.getItem("speechSettings");
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      document.getElementById("key").value = parsed.key || "";
      document.getElementById("regionOptions").value = parsed.region || "westus";
      document.getElementById("languageOptions").value = parsed.language || "en-US";
      if (parsed.inputSource === "File") {
        document.getElementById("inputSourceFileRadio").checked = true;
      } else {
        document.getElementById("inputSourceMicrophoneRadio").checked = true;
      }
      document.getElementById("scenarioSelection").value = parsed.scenario || "speechRecognizerRecognizeOnce";
      if (parsed.format === "Detailed") {
        document.getElementById("formatDetailedRadio").checked = true;
      } else {
        document.getElementById("formatSimpleRadio").checked = true;
      }
      document.getElementById("languageTargetOptions").value = parsed.languageTarget || "de-DE-BerndNeural";
      document.getElementById("voiceOutput").checked = parsed.voiceOutput;
      document.getElementById("appId").value = parsed.appId || "";
      document.getElementById("phrases").value = parsed.phrases || "";
      document.getElementById("referenceText").value = parsed.referenceText || "";
    } catch (e) {
      console.error("Error loading speech settings:", e);
    }
  }
}

// Setup change event listeners on all inputs in the settings modal to save changes
function setupSettingsSave() {
  const inputs = document.querySelectorAll("#settingsModal input, #settingsModal select");
  inputs.forEach(input => {
    input.addEventListener("change", saveSettings);
  });
}

// On DOMContentLoaded, initialize everything
document.addEventListener("DOMContentLoaded", function () {
  loadSettings();
  setupSettingsSave();
  enumerateMicrophones();
  document.getElementById("micBtn").addEventListener("click", toggleRecognition);
  InitializeSpeechSDK(function (sdk) {
    SpeechSDK = sdk;
    RequestAuthorizationToken();
  });
  document.getElementById("inputSourceChooseFileButton").addEventListener("click", function () {
    document.getElementById("inputSourceFileLabel").innerHTML = 'Select audio file';
    audioFile = null;
    document.getElementById("filePicker").click();
  });
  document.getElementById("filePicker").addEventListener("change", function () {
    audioFile = this.files[0];
    document.getElementById("inputSourceFileLabel").innerHTML = audioFile.name;
  });
  document.getElementById("inputSourceMicrophoneRadio").addEventListener("click", enumerateMicrophones);
});