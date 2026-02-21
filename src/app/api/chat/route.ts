import OpenAI from "openai";
import { formatStreamPart, OpenAIStream, StreamingTextResponse } from "ai";

const openai = new OpenAI();

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

const SYSTEM_PROMPT = `You are Connor Support, Connor Hyatt's portfolio chatbot. Be casual, warm, and helpful.

CONNOR'S INFO:
- 21yo CMU student, BS Information Systems (graduating May 2027), AI Management minor
- Dean's List (2x), won 1st prize in ALPFA Business Case Competition
- CTO at Lunon (Sept 2025-present): Building RAG AI platform for consulting teams. Check out [Lunon](https://www.lunon.ai)
- Symetra (May-Aug 2025): Data Analyst, rebuilt insurance reporting in SQL/Python, cut runtime by 99.83%
- CMU XR Lab (May-Aug 2024): Software Engineer, built first XR Lab management system
- CMU CyLab (May-Aug 2023): Data Engineer, built Python pipelines for cybersecurity research
- Team RobotiX (Sept 2021-present): Co-founder of 501(c)(3) nonprofit, STEM education for 6000+ K-8 students. See [teamrobotix.com](https://www.teamrobotix.com)
- Skills: Python, SQL, JavaScript, Java, data engineering, full-stack dev, RAG/AI, PostgreSQL, MongoDB
- Hobbies: Lifting (4+ days/week), volleyball, golf, side projects
- Contact: connorhyatt1@gmail.com
- Links: [LinkedIn](https://linkedin.com/in/connorhyatt), [GitHub](https://github.com/hyattc1)

PROJECTS:
- Ferretti Yachts Database: MySQL database design. [Report](https://connorhyatt.com/ferretti_report.pdf)
- Senate Sentiment Analysis: NLP pipeline analyzing 50k+ senator posts
- Propwise: Real-time risk analysis for real estate investors (WIP)
- One Piece Baseball: Python game with CMU Graphics
- Phantom Reload: OpenCV raycaster game with laser pointer controls

RESPONSE RULES:
- Keep responses 2-3 sentences for simple questions, up to 5 for detailed ones
- For greetings like "hello" or "hi", introduce yourself briefly and suggest 2-3 things to ask about WITH links, e.g. "his work at [Lunon](https://www.lunon.ai), his [projects](https://connorhyatt.com/projects), or his [resume](https://connorhyatt.com/resume.pdf)"
- LINKS: Always use FULL markdown link syntax with the URL. Write [resume](https://connorhyatt.com/resume.pdf) NOT just [resume]. Every link MUST include the full URL in parentheses.
- NEVER use em dashes or en dashes. Use commas, periods, or hyphens instead
- Embed links naturally in sentences, no bullet lists of links
- For off-topic questions, briefly acknowledge then redirect to Connor
- If unsure, suggest checking his [resume](https://connorhyatt.com/resume.pdf) or [contact page](https://connorhyatt.com/contact)

COPY THESE EXACT LINK FORMATS:
- [resume](https://connorhyatt.com/resume.pdf)
- [contact](https://connorhyatt.com/contact)
- [projects](https://connorhyatt.com/projects)
- [blog](https://connorhyatt.com/blog)
- [Lunon](https://www.lunon.ai)
- [LinkedIn](https://linkedin.com/in/connorhyatt)
- [GitHub](https://github.com/hyattc1)`;

const GREETINGS_ARR = [
  "hello", "hey", "hi", "hi there", "hey there", "hello there",
  "whats up", "what's up", "wassup", "wsup", "whats good", "what's good",
  "sup", "yo", "howdy", "greetings", "hiya", "heya", "hey ya",
  "ello", "hallo", "aloha", "hi hi", "hey hey", "heyyo", "heyy", "heyyy",
  "hii", "hiiii", "helloo", "hellooo", "hullo", "helo",
  "good morning", "good afternoon", "good evening", "good day",
  "gm", "gday", "mornin", "morning", "evening",
  "how are you", "how's it going", "hows it going", "how ya doing",
  "how you doing", "how are ya", "how's things", "how goes it",
  "hola", "bonjour", "ciao", "oi", "namaste", "salutations",
  "help", "help me", "i need help", "can you help", "need help",
  "what can you do", "what do you do", "what can you help with",
  "who are you", "what are you", "are you real", "are you a bot",
  "are you human", "whats your name", "what's your name",
  "hey what's up", "hi how are you", "hello how are you",
  "start", "begin", "go",
];
const GREETINGS = new Set(GREETINGS_ARR);
const GREETING_FIRST_WORDS = new Set(
  GREETINGS_ARR.map((g) => g.split(/\s/)[0]?.replace(/[^\w']/g, "") ?? g),
);

const GREETING_RESPONSE =
  "Hi there! I'm Connor's portfolio chatbot. Feel free to ask about his work at [Lunon](https://www.lunon.ai), his [projects](https://connorhyatt.com/projects), or check out his [resume](https://connorhyatt.com/resume.pdf). How can I help you today?";

function normalizeForGreeting(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[^\w']+|[^\w'\s]+$/g, "");
}

function isGreeting(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const n = normalizeForGreeting(text);
  const first = (n.split(/\s/)[0] ?? "").replace(/[^\w']/g, "");
  return (
    GREETINGS.has(n) ||
    GREETINGS_ARR.some((g) => n.startsWith(g + " ")) ||
    GREETING_FIRST_WORDS.has(first)
  );
}

function getMessageText(msg: unknown): string {
  if (!msg || typeof msg !== "object") return "";
  const m = msg as Record<string, unknown>;
  const c = m.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    const part = c.find((p) => (p as { type?: string })?.type === "text");
    return (part as { text?: string })?.text ?? "";
  }
  return "";
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const { messages } = await req.json();

    const latestMsg = messages?.[messages.length - 1];
    const latestMessage = latestMsg ? getMessageText(latestMsg) : "";

    if (latestMessage && isGreeting(latestMessage)) {
      const payload = formatStreamPart("text", GREETING_RESPONSE);
      return new Response(payload, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
