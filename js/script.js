document.addEventListener('DOMContentLoaded', function() {
  // Initialize CodeMirror editor and expose it globally.
  var editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "htmlmixed",
    theme: "dracula",
    lineNumbers: true,
    lineWrapping: true
  });
  window.editor = editor;

  // Two-way binding: update preview when code changes.
  var previewContainer = document.getElementById("rendered-content");
  previewContainer.setAttribute("contenteditable", "true");
  var syncingFromPreview = false;
  var syncingFromCodeMirror = false;

  function updatePreview() {
    if (syncingFromPreview) return;
    syncingFromCodeMirror = true;
    var code = editor.getValue();
    var parser = new DOMParser();
    var doc = parser.parseFromString(code, "text/html");
    previewContainer.innerHTML = doc.body.innerHTML;
    syncingFromCodeMirror = false;
  }

  function updateCodeFromPreview() {
    if (syncingFromCodeMirror) return;
    syncingFromPreview = true;
    var updatedBody = previewContainer.innerHTML;
    var code = editor.getValue();
    var parser = new DOMParser();
    var doc = parser.parseFromString(code, "text/html");
    doc.body.innerHTML = updatedBody;
    var updatedCode = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    editor.setValue(updatedCode);
    syncingFromPreview = false;
  }

  updatePreview();
  editor.on("change", updatePreview);
  previewContainer.addEventListener("input", updateCodeFromPreview);

  // Show settings modal when settings button is clicked.
  var settingsBtn = document.getElementById("settingsBtn");
  settingsBtn.addEventListener("click", function() {
    $("#settingsModal").modal("show");
  });

  // When the Settings modal is shown, enumerate available microphones.
  $("#settingsModal").on("shown.bs.modal", function() {
    window.enumerateMicrophones();
  });

  // -------------------------------
  // Local Storage for Settings
  // -------------------------------
  function loadSettings() {
    const settings = localStorage.getItem("appSettings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        // Speech settings
        document.getElementById("key").value = parsed.key || "";
        document.getElementById("regionOptions").value = parsed.region || "westus";
        document.getElementById("languageOptions").value = parsed.language || "en-US";
        document.getElementById("inputSourceMicrophoneRadio").checked = true;
        document.getElementById("scenarioSelection").value = parsed.scenario || "speechRecognizerRecognizeOnce";
        if (parsed.format === "Detailed") {
          document.getElementById("formatDetailedRadio").checked = true;
        } else {
          document.getElementById("formatSimpleRadio").checked = true;
        }
        // LLM credentials
        document.getElementById("llmEndpoint").value = parsed.llmEndpoint || "";
        document.getElementById("llmApiKey").value = parsed.llmApiKey || "";
        document.getElementById("llmDeploymentName").value = parsed.llmDeploymentName || "";
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
  }

  function saveSettings() {
    const settings = {
      key: document.getElementById("key").value,
      region: document.getElementById("regionOptions").value,
      language: document.getElementById("languageOptions").value,
      inputSource: document.querySelector('input[name="inputSourceOption"]:checked').value,
      scenario: document.getElementById("scenarioSelection").value,
      format: document.querySelector('input[name="formatOption"]:checked').value,
      llmEndpoint: document.getElementById("llmEndpoint").value,
      llmApiKey: document.getElementById("llmApiKey").value,
      llmDeploymentName: document.getElementById("llmDeploymentName").value
    };
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }

  function setupSettingsSave() {
    const inputs = document.querySelectorAll("#settingsModal input, #settingsModal select");
    inputs.forEach(input => {
      input.addEventListener("change", saveSettings);
    });
  }

  loadSettings();
  setupSettingsSave();

  // -------------------------------
  // SPACEBAR-HOLD TO TALK FUNCTIONALITY
  // -------------------------------
  document.addEventListener("keydown", function(e) {
    if (e.code === "Space" && !e.repeat) {
      if (!window.isRecognizing) {
        window.startRecognition();
      }
    }
  });

  document.addEventListener("keyup", function(e) {
    if (e.code === "Space") {
      if (window.isRecognizing) {
        window.stopRecognition();
        setTimeout(function() {
          document.getElementById("submitBtn").click();
        }, 1000);
      }
    }
  });
});
