const API_BASE = "https://jsonxmlapi.onrender.com"; // zmień na adres backendu online, jeśli hostujesz

const input = document.getElementById("input");
const output = document.getElementById("output");

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

async function convert(endpoint) {
    const data = input.value.trim();
    if (!data) {
        output.value = "⚠️ Wklej dane wejściowe!";
        return;
    }
    output.value = "⏳ Przetwarzanie...";
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: data,
        });
        if (!res.ok) throw new Error(await res.text());
        const text =
            endpoint === "xml-to-json"
                ? JSON.stringify(await res.json(), null, 2)
                : await res.text();
        output.value = text;
    } catch (e) {
        output.value = "❌ Błąd: " + e.message;
    }
}

// 🔹 Automatyczna konwersja po wklejeniu lub edycji
input.addEventListener("input", () => {
    clearTimeout(autoConvertTimeout);
    autoConvertTimeout = setTimeout(() => {
        const format = detectFormat(input.value);
        if (!format) return;
        if (format === "json") {
            convert("json-to-xml");
        } else if (format === "xml") {
            convert("xml-to-json");
        }
    }, 700); // czeka 0.7 sekundy po wpisaniu
});

// 🔹 Obsługa przycisków
toXmlBtn.addEventListener("click", () => convert("json-to-xml"));
toJsonBtn.addEventListener("click", () => convert("xml-to-json"));

copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "✅ Skopiowano!";
    setTimeout(() => (copyBtn.textContent = "📋 Kopiuj"), 1500);
});

clearBtn.addEventListener("click", () => {
    input.value = "";
    output.value = "";
});

downloadBtn.addEventListener("click", () => {
    const blob = new Blob([output.value], { type: "text/plain" });
    const ext = output.value.trim().startsWith("<") ? "xml" : "json";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
});
