const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testTranslation() {
  const apiKey = process.env.GEMINI_API_KEY; // Need to provide this manually for test
  if (!apiKey) {
    console.log("No API Key provided for test");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Translate 'Hello world' to Spanish.";
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Translation:", text);
    console.log("Usage:", result.response.usageMetadata);
  } catch (error) {
    console.error("Error:", error);
  }
}

// testTranslation();
