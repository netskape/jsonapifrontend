const API_BASE = "https://jsonxmlapi.onrender.com"; // zmień na adres backendu online, jeśli hostujesz

const inputEl = document.getElementById("input");
let inputCode = document.getElementById("inputCode");
const outputCode = document.getElementById("outputCode");

const toXmlBtn = document.getElementById("toXml");
const toJsonBtn = document.getElementById("toJson");
const copyBtn = document.getElementById("copy");
const clearBtn = document.getElementById("clear");
const downloadBtn = document.getElementById("download");

let autoConvertTimeout = null;

function detectFormat(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
    if (trimmed.startsWith("<")) return "xml";
    return null;
}

function getInputText() {
    return inputCode.textContent.trim();
}

// 🔹 Funkcja do kolorowania składni
function setInputHighlight() {
    const text = getInputText();
    const format = detectFormat(text);
    inputCode.className = format === "xml" ? "language-xml" : "language-json";
    inputCode.textContent = text;
    Prism.highlightElement(inputCode);
}

// 🔹 Pretty-print XML
function formatXml(xml) {
    const PADDING = "  ";
    const reg = /(>)(<)(\/*)/g;
    let pad = 0;
    xml = xml.replace(reg, "$1\r\n$2$3");
    return xml
        .split("\r\n")
        .map((node) => {
            let indent = "";
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = PADDING.repeat(pad);
            } else if (node.match(/^<\/\w/)) {
                pad = Math.max(pad - 1, 0);
                indent = PADDING.repeat(pad);
            } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
                indent = PADDING.repeat(pad);
                pad++;
            } else {
                indent = PADDING.repeat(pad);
            }
            return indent + node;
        })
        .join("\r\n");
}

// 🔹 Pretty-print INPUT
function prettyInput() {
    const text = getInputText();
    const format = detectFormat(text);
    if (!format) return;

    try {
        if (format === "json") {
            inputCode.textContent = JSON.stringify(JSON.parse(text), null, 2);
        } else if (format === "xml") {
            inputCode.textContent = formatXml(text);
        }
        Prism.highlightElement(inputCode);
    } catch {
        // jeśli błąd – zostaw surowe dane
    }
}

// 🔹 Pretty-print OUTPUT
function showOutput(data, type) {
    let formatted;

    if (type === "json") {
        try {
            formatted = JSON.stringify(JSON.parse(data), null, 2);
        } catch {
            formatted = data;
        }
    } else if (type === "xml") {
        formatted = formatXml(data);
    } else {
        formatted = data;
    }

    outputCode.className = type === "json" ? "language-json" : "language-xml";
    outputCode.textContent = formatted;
    Prism.highlightElement(outputCode);
}

// 🔹 Konwersja przez API
async function convert(endpoint) {
    const data = getInputText();
    if (!data) {
        outputCode.textContent = "⚠️ Wklej dane wejściowe!";
        Prism.highlightElement(outputCode);
        return;
    }

    outputCode.textContent = "⏳ Przetwarzanie...";
    Prism.highlightElement(outputCode);

    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: data,
        });

        if (!res.ok) throw new Error(await res.text());

        let text, type;
        if (endpoint === "xml-to-json") {
            const json = await res.json();
            text = JSON.stringify(json, null, 2);
            type = "json";
        } else {
            text = await res.text();
            type = "xml";
        }

        showOutput(text, type);
    } catch (e) {
        outputCode.textContent = "❌ Błąd: " + e.message;
        Prism.highlightElement(outputCode);
    }
}

// 🔹 Auto-konwersja
function handleInputChange() {
    const text = getInputText();
    if (!text) {
        // 🧹 jeśli pole wejściowe puste — czyścimy output
        outputCode.textContent = "";
        Prism.highlightElement(outputCode);
        return;
    }

    setInputHighlight();
    clearTimeout(autoConvertTimeout);
    autoConvertTimeout = setTimeout(() => {
        const format = detectFormat(text);
        if (!format) return;
        if (format === "json") convert("json-to-xml");
        else if (format === "xml") convert("xml-to-json");
    }, 700);
}

// ✅ Rejestracja eventów
function attachInputListeners() {
    inputEl.addEventListener("input", handleInputChange);

    inputEl.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text");

        // 💡 Resetujemy strukturę DOM po wklejeniu
        inputEl.innerHTML = `<code id="inputCode" class="language-json"></code>`;
        inputCode = document.getElementById("inputCode");

        inputCode.textContent = text;
        prettyInput(); // sformatuj natychmiast
        handleInputChange();
    });
}

// 🔹 Przyciski
toXmlBtn.addEventListener("click", () => convert("json-to-xml"));
toJsonBtn.addEventListener("click", () => convert("xml-to-json"));

copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(outputCode.textContent);
    copyBtn.textContent = "✅ Skopiowano!";
    setTimeout(() => (copyBtn.textContent = "📋 Kopiuj"), 1500);
});

clearBtn.addEventListener("click", () => {
    inputCode.textContent = "";
    outputCode.textContent = "";
    Prism.highlightAll();
});

downloadBtn.addEventListener("click", () => {
    const blob = new Blob([outputCode.textContent], { type: "text/plain" });
    const ext = outputCode.textContent.trim().startsWith("<") ? "xml" : "json";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
});

// 🔹 Start
attachInputListeners();
