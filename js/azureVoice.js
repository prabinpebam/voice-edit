// azureVoice.js

let recognizer = null;
let isRecognizing = false;
let authorizationToken = null;

function RequestAuthorizationToken() {
  const authorizationEndpoint = "server/token.php";
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
        console.log("Got an authorization token:", tokenPayload);
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    };
  }
}

function getSpeechConfig() {
  if (!window.SpeechSDK) {
    alert("Speech SDK not loaded.");
    return null;
  }
  const sdk = window.SpeechSDK;
  const keyElem = document.getElementById("key");
  const regionElem = document.getElementById("regionOptions");
  const langElem = document.getElementById("languageOptions");

  if (!keyElem.value || !regionElem.value) {
    alert("Please enter your Cognitive Services Speech subscription key!");
    return null;
  }

  let speechConfig = authorizationToken
    ? sdk.SpeechConfig.fromAuthorizationToken(authorizationToken, regionElem.value)
    : sdk.SpeechConfig.fromSubscription(keyElem.value, regionElem.value);

  speechConfig.speechRecognitionLanguage = langElem.value;
  return speechConfig;
}

function enumerateMicrophones() {
  const loader = document.getElementById("micLoader");
  if (loader) {
    loader.style.display = "inline-block";
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("Unable to enumerate audio devices.");
    if (loader) loader.style.display = "none";
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
  }).catch((err) => {
    console.error("Error enumerating devices:", err);
  }).finally(() => {
    if (loader) loader.style.display = "none";
  });
}

function startRecognition() {
  const speechConfig = getSpeechConfig();
  if (!speechConfig) return;

  // Get the selected device ID.
  const micSelect = document.getElementById("microphoneSources");
  let deviceId = micSelect ? micSelect.value : undefined;
  const audioConfig = window.SpeechSDK.AudioConfig.fromMicrophoneInput(deviceId);

  recognizer = new window.SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  recognizer.recognized = function (s, e) {
    document.getElementById("prompt").value = e.result.text;
  };
  recognizer.startContinuousRecognitionAsync();
  isRecognizing = true;
  window.isRecognizing = true;
}

function stopRecognition() {
  if (recognizer) {
    recognizer.stopContinuousRecognitionAsync(() => {
      recognizer.close();
      recognizer = null;
      isRecognizing = false;
      window.isRecognizing = false;
    });
  }
}

window.startRecognition = startRecognition;
window.stopRecognition = stopRecognition;
window.enumerateMicrophones = enumerateMicrophones;
