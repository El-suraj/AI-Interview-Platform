"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackRetry, setFeedbackRetry] = useState(0);
  const feedbackGenerationStarted = useRef(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      console.error("Vapi error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  const handleGenerateFeedback = useCallback(async () => {
    if (!interviewId || !userId) {
      setFeedbackError("Your session has expired. Please sign in and try again.");
      return;
    }

    console.info("[feedback] generating from captured final messages", {
      messageCount: messages.length,
    });
    setIsSavingFeedback(true);
    setFeedbackError("");

    try {
      const result = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
      });

      if (result.success && result.feedbackId) {
        console.info("[feedback] generation and save completed");
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        setFeedbackError(
          result.error ?? "Feedback could not be saved. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to generate interview feedback:", error);
      setFeedbackError(
        error instanceof Error
          ? error.message
          : "Feedback could not be generated or saved. Please try again."
      );
    } finally {
      setIsSavingFeedback(false);
    }
  }, [interviewId, messages, router, userId]);

  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED) return;
    if (type === "generate") {
      router.push("/");
      return;
    }
    if (feedbackGenerationStarted.current) return;

    // Wait briefly for a final transcript event that may arrive after call-end.
    const timeout = window.setTimeout(() => {
      feedbackGenerationStarted.current = true;
      void handleGenerateFeedback();
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [callStatus, feedbackRetry, handleGenerateFeedback, router, type]);

  const handleCall = async () => {
    feedbackGenerationStarted.current = false;
    setFeedbackError("");
    setMessages([]);
    setLastMessage("");
    setCallStatus(CallStatus.CONNECTING);

    // One dashboard assistant serves both flows; its system prompt branches on
    // the `mode` variable (see README "Vapi migration").
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (type === "generate") {
      console.log(
        "Starting Vapi assistant for interview generation:",
        assistantId || process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
      );
      await vapi.start(
        assistantId || process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, // legacy fallback
        {
          variableValues: {
            mode: "generate",
            username: userName,
            userid: userId,
          },
        }
      );
      console.log("VAPI assistant started for generation");
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      // Falls back to the inline `interviewer` DTO when no assistant ID is
      // configured, so the interview flow still works without dashboard setup.
      await vapi.start(assistantId || interviewer, {
        variableValues: {
          mode: "interview",
          username: userName,
          userid: userId,
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {feedbackError && (
        <div role="alert" className="flex flex-col items-center gap-3 text-center">
          <p>{feedbackError}</p>
          <button
            type="button"
            className="btn-primary px-4 py-2"
            onClick={() => {
              if (messages.length === 0) {
                void handleCall();
                return;
              }
              feedbackGenerationStarted.current = false;
              setFeedbackRetry((attempt) => attempt + 1);
            }}
          >
            {messages.length > 0 ? "Retry feedback" : "Start interview again"}
          </button>
        </div>
      )}

      {isSavingFeedback && (
        <p role="status" className="text-center">
          Generating and saving your interview feedback...
        </p>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => handleCall()}
            disabled={isSavingFeedback}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : "Calling . . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
