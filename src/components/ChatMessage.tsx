import { cn } from "@/lib/utils";
import { Message } from "ai";
import { Bot } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({
  message: { role, content },
}: ChatMessageProps) {
  const isBot = role === "assistant";

  return (
    <div
      className={cn(
        "mb-3 flex w-full items-start min-w-0",
        isBot ? "justify-start" : "justify-end",
      )}
    >
      {isBot && <Bot className="mr-2 size-5 shrink-0" />}
      <div
        className={cn(
          "max-w-md rounded-lg px-4 py-2.5 text-sm leading-relaxed break-words min-w-0",
          isBot ? "bg-foreground text-background border border-background" : "bg-foreground text-background border border-background",
        )}
      >
        <Markdown
          components={{
            a: ({ node, href, ...props }) => {
              const isExternal = href?.startsWith('http') && !href?.includes('connorhyatt.com');
              return (
                <Link
                  href={href ?? ""}
                  className="text-background/80 hover:text-background underline underline-offset-2 transition-colors"
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  {...props}
                />
              );
            },
            p: ({ node, ...props }) => (
              <p className="mt-2 first:mt-0 last:mb-0" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="mt-2 list-inside list-disc first:mt-0 space-y-1"
                {...props}
              />
            ),
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
}
