import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { questionSchema } from "@/constants";
import { generateObject } from "ai";

export async function POST(request: Request) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    console.error(
      "CRASH 0: Failed to parse request JSON (shouldn't happen with Vapi):",
      e
    );
    return Response.json({ success: false, error: e.message }, { status: 400 });
  }
  const { type, role, level, techstack, amount, userid } = await request.json();

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
      model: google("gemini-2.0-flash-001"),
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
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
