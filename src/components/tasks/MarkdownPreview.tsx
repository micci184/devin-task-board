'use client'

import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
  highlightMentions?: boolean
}

const renderTextWithMentions = (text: string) => {
  const parts = text.split(/(@[\w\u3000-\u9FFF\uF900-\uFAFF]+)/g)
  return parts.map((part, i) => {
    if (part.match(/^@[\w\u3000-\u9FFF\uF900-\uFAFF]+$/)) {
      return (
        <span
          key={i}
          className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary"
        >
          {part}
        </span>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export const MarkdownPreview = ({ content, highlightMentions = true }: MarkdownPreviewProps) => {
  return (
    <div className="prose prose-sm max-w-none text-foreground/80 [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_a]:text-primary [&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-foreground/80 [&_pre]:bg-foreground/5 [&_pre]:text-foreground/80 [&_blockquote]:border-foreground/20 [&_blockquote]:text-foreground/60 [&_table]:text-foreground/80 [&_th]:border-foreground/20 [&_td]:border-foreground/20 [&_hr]:border-foreground/10 [&_ul]:text-foreground/80 [&_ol]:text-foreground/80 [&_li]:text-foreground/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={
          highlightMentions
            ? {
                p: ({ children }) => {
                  const processed = processChildren(children)
                  return <p>{processed}</p>
                },
                li: ({ children }) => {
                  const processed = processChildren(children)
                  return <li>{processed}</li>
                },
              }
            : undefined
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function processChildren(children: React.ReactNode): React.ReactNode {
  if (!children) return children
  if (typeof children === 'string') {
    return renderTextWithMentions(children)
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <Fragment key={i}>{renderTextWithMentions(child)}</Fragment>
      }
      return child
    })
  }
  return children
}
