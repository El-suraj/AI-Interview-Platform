import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { questionSchema } from "@/constants";
import { generateObject } from "ai";

export async function POST(request: Request) {
  let payload: Record<string, any>;
  try {
    payload = await request.json();
  } catch (e) {
    console.error(
      "CRASH 0: Failed to parse request JSON (shouldn't happen with Vapi):",
      e
    );
    return Response.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  // NOTE: the body is read exactly once — `Request.json()` may only be called
  // once, the underlying stream is consumed afterwards.
  //
  // Two accepted payload shapes:
  // 1. Vapi function-tool call (current):
  //      { message: { type: "function-call", functionCall: { parameters } }, call: {...} }
  // 2. Flat body (legacy Workflow "API Request" node, retired 2026-08-18):
  //      { type, role, level, techstack, amount, userid }
  const parameters: Record<string, any> =
    payload?.message?.functionCall?.parameters ?? payload;
  const variableValues: Record<string, any> =
    payload?.message?.call?.assistantOverrides?.variableValues ?? {};
  const { type, role, level, techstack, amount } = parameters;
  const userid = parameters.userid ?? variableValues.userid;

  // Guard: Gather must only run in the shared assistant's "generate" mode —
  // a misfire during an interview call would create a junk interview row.
  // (Best effort: relies on assistantOverrides being echoed on the call object.)
  if (variableValues.mode !== undefined && variableValues.mode !== "generate") {
    console.warn("LOG 0: Rejected Gather call in mode:", variableValues.mode);
    return Response.json(
      {
        success: false,
        error: `Gather is only allowed in generate mode (received mode "${variableValues.mode}").`,
      },
      { status: 400 }
    );
  }

  // Fail fast instead of generating an interview with "undefined" fields.
  const fieldValues: Record<string, any> = { ...parameters, userid };
  const missing = [
    "type",
    "role",
    "level",
    "techstack",
    "amount",
    "userid",
  ].filter((key) => !String(fieldValues[key] ?? "").trim());
  if (missing.length > 0) {
    console.warn("LOG 0: Missing required fields:", missing.join(", "));
    return Response.json(
      {
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    console.log(
      "LOG 1: Webhook Inputs - User ID:",
      userid,
      "Role:",
      role,
      "Tech Stack:",
      techstack
    );
    const { object } = await generateObject({
      model: google("gemini-3.8-flash "),
      schema: questionSchema,
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });
    console.log(
      "LOG 2: AI Generation Succeeded. Questions array length:",
      object.questions.length
    );

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(",").map((s: string) => s.trim()),
      questions: object.questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };
    console.log(
      "LOG 3: Interview Object Prepared. Keys:",
      Object.keys(interview)
    );
    await db.collection("interviews").add(interview);
    console.log("LOG 4: Database write SUCCESS.");
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/vapi/generate:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
