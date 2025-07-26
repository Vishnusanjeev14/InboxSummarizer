import { ChatPromptTemplate } from "@langchain/core/prompts";
import 'dotenv/config'
import { ChatOllama } from "@langchain/ollama";

const llm = new ChatOllama({
    model: "mistral",
    temperature: 0.2,
});

const summarizingPrompt = ChatPromptTemplate.fromTemplate(
    `
    You are an expert email summarizer.
    Your task is to read the content of an email and generate a short, clear, and professional summary in **1–3 sentences**.

    - Focus on the **main point**, purpose, or call to action.
    - Remove signatures, greetings, and irrelevant formatting.
    - If the email contains event details, deadlines, or offers, highlight them.

    Email:
    {emailContent}

    Return only the summary.
    `
);


async function summarizeEmail(emailContent) {
  const prompt = await summarizingPrompt.invoke({ emailContent });
  const result = await llm.invoke(prompt);

  return result;
}

export default summarizeEmail;   