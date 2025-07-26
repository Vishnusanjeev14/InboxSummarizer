import * as cheerio from "cheerio";

/**
 * Parses the provided HTML and extracts only the important content
 * suitable for input into a large language model (LLM).
 */
const parseHTML = (html) => {
  const $ = cheerio.load(html);
  $("script, style, head nav footer aside").remove();
  $("img").each((_, img) => {
    const altText = $(img).attr("alt");
    if (altText) {
      $(img).replaceWith(`<p>${altText}</p>`);
    } else {
      $(img).remove();
    }
  });
  let rawText = $.text().trim();
  let cleanText = rawText
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return cleanText;
};

/**
 * Extracts only the HTML portion from a string.
 */
function extractHtmlOnly(body) {
  const doctypeStart = body.indexOf("<!DOCTYPE html");
  const htmlStart = body.indexOf("<html", doctypeStart);
  const htmlEnd = body.indexOf("</html>");

  if (doctypeStart !== -1 && htmlStart !== -1 && htmlEnd !== -1) {
    return body.slice(doctypeStart, htmlEnd + 7);
  }

  return "";
}

/**
 * Processes the HTML portion within the body and replaces it
 * with cleaned-up content, while preserving non-HTML data.
 *
 * @param {string} body - The entire content (including HTML and non-HTML).
 * @returns {string} The same body with HTML processed and replaced with clean text.
 */

function processHTML(body) {
  const htmlPart = extractHtmlOnly(body);
  if (!htmlPart) return body; // No HTML found, return original

  const cleanText = parseHTML(htmlPart);
  return body.replace(htmlPart, cleanText);
}

export { processHTML, parseHTML, extractHtmlOnly };
