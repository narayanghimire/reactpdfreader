import React, { useState } from "react";
import "./App.css";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [pdfText, setPdfText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        text += pageText + "\n";
      }
      setPdfText(text);
    };
    fileReader.readAsArrayBuffer(file);
  };

  const askQuestion = async () => {
    if (!pdfText || !question) return;
    setLoading(true);
    try {
      const res = await fetch("https://readpdf-bda3.onrender.com/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a content assistant answering questions from a PDF document."
      },
      {
        role: "user",
        content: `Context: ${pdfText}\n\nQuestion: ${question}`
      }
    ]
  }),
});


      const data = await res.json();
      setAnswer(data.choices[0].message.content);
    } catch (err) {
      console.error(err);
      setAnswer("Error fetching answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>PDF QA using Groq</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <textarea
        placeholder="Ask a question about the PDF..."
        rows={4}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      ></textarea>
      <button onClick={askQuestion} disabled={loading}>
        {loading ? "Asking..." : "Ask"}
      </button>
      <h3>Answer:</h3>
      <p>{answer}</p>
    </div>
  );
}

export default App;
