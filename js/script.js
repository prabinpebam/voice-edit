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
  });
  