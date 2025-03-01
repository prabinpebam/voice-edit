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


   // --- SPACEBAR-HOLD TO TALK FUNCTIONALITY ---
    // When the spacebar is pressed and held, start recognition.
    document.addEventListener("keydown", function(e) {
      if (e.code === "Space" && !e.repeat) {
        // Start recognition using the globally exposed function from azureVoice.js.
        if (!window.isRecognizing) {
          window.startRecognition();
        }
      }
    });
  
    // When the spacebar is released, stop recognition and then auto-submit.
    document.addEventListener("keyup", function(e) {
      if (e.code === "Space") {
        if (window.isRecognizing) {
          window.stopRecognition();
          // Wait briefly for the final recognition result to be processed, then auto-submit.
          setTimeout(function() {
            document.getElementById("submitBtn").click();
          }, 1000);
        }
      }
    });




  // Show settings modal when settings button is clicked.
  var settingsBtn = document.getElementById("settingsBtn");
  settingsBtn.addEventListener("click", function() {
    $("#settingsModal").modal("show");
  });

  // When the Settings modal is shown, scan for microphones.
  $("#settingsModal").on("shown.bs.modal", function() {
    window.enumerateMicrophones();
  });

  // -------------------------------
  // Local Storage for Modal Settings
  // -------------------------------

  // Load settings from local storage and update UI elements.
  function loadSettings() {
    const settings = localStorage.getItem("speechSettings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        document.getElementById("key").value = parsed.key || "";
        document.getElementById("regionOptions").value = parsed.region || "westus";
        document.getElementById("languageOptions").value = parsed.language || "en-US";
        // Input source (we only have microphone here).
        document.getElementById("inputSourceMicrophoneRadio").checked = true;
        document.getElementById("scenarioSelection").value = parsed.scenario || "speechRecognizerRecognizeOnce";
        if (parsed.format === "Detailed") {
          document.getElementById("formatDetailedRadio").checked = true;
        } else {
          document.getElementById("formatSimpleRadio").checked = true;
        }
      } catch (e) {
        console.error("Error loading speech settings:", e);
      }
    }
  }

  // Save settings to local storage whenever a change is made.
  function saveSettings() {
    const settings = {
      key: document.getElementById("key").value,
      region: document.getElementById("regionOptions").value,
      language: document.getElementById("languageOptions").value,
      // For now, we assume only Microphone is available.
      inputSource: document.querySelector('input[name="inputSourceOption"]:checked').value,
      scenario: document.getElementById("scenarioSelection").value,
      format: document.querySelector('input[name="formatOption"]:checked').value
    };
    localStorage.setItem("speechSettings", JSON.stringify(settings));
  }

  // Attach change listeners to all inputs/selects within the settings modal.
  function setupSettingsSave() {
    const inputs = document.querySelectorAll("#settingsModal input, #settingsModal select");
    inputs.forEach(input => {
      input.addEventListener("change", saveSettings);
    });
  }

  loadSettings();
  setupSettingsSave();
});
