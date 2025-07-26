import { RunnableMap } from "@langchain/core/runnables";
import classifyEmail from "./classifier.js";
import summarizeEmail from "./summarizer.js";

export const classifyAndSummarize = RunnableMap.from({
  classification: classifyEmail,
  summary: summarizeEmail,
});
