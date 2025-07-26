import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import 'dotenv/config'
import { ChatOllama } from "@langchain/ollama";

const llm = new ChatOllama({
    model: "mistral",
    temperature: 0.2,
});

const classificationSchema = z.object({
    type: z.enum(["spam", "news", "social", "opportunities"]).describe("The type of classification for the email"),
    priority: z.enum(["high", "medium", "low"]).describe("The priority of the email"),
    reason: z.string().describe("The reason for the classification"),
})

const taggingPrompt = ChatPromptTemplate.fromTemplate(
  `
    You are an email classifier.

    Classify each email according to the following schema:

    - type: one of ["spam", "news", "social", "opportunities"]
    - priority: one of ["high", "medium", "low"]
    - reason: a short explanation of why the email was classified that way

    ### Examples

    Email: "Apply now to the Google Summer Internship"
    Type: opportunities  
    Priority: high  
    Reason: This is an internship opportunity from a well-known company.

    ---

    Email: "Your daily news digest is here!"
    Type: news  
    Priority: medium  
    Reason: It's a regular news update with informational content.

    ---

    Email: "Join us for the IEEE Hackathon 2025!"
    Type: opportunities  
    Priority: high  
    Reason: A competitive event offering learning, networking, and rewards.

    ---

    Email: "Congratulations! You’ve won a new iPhone"
    Type: spam  
    Priority: low  
    Reason: This is likely promotional or deceptive content.

    ---

    Email: "Hey, let’s catch up this weekend!"
    Type: social  
    Priority: low  
    Reason: A friendly message from a personal contact.

    ---

    Now classify the following email:

    {emailContent}

    Return the classification in JSON format.
  `
);

const llmWithStructuredOutput = llm.withStructuredOutput(classificationSchema, {
    name: "emailClassification",
});

async function classifyEmail(emailContent) {
    const prompt = await taggingPrompt.invoke({
        emailContent,
    });
    const classification = await llmWithStructuredOutput.invoke(prompt);
    
    return classification;
}

export default classifyEmail;