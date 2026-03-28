'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
}

export const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  return (
    <div className="prose prose-sm max-w-none text-foreground/80 [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_a]:text-primary [&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-foreground/80 [&_pre]:bg-foreground/5 [&_pre]:text-foreground/80 [&_blockquote]:border-foreground/20 [&_blockquote]:text-foreground/60 [&_table]:text-foreground/80 [&_th]:border-foreground/20 [&_td]:border-foreground/20 [&_hr]:border-foreground/10 [&_ul]:text-foreground/80 [&_ol]:text-foreground/80 [&_li]:text-foreground/80">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
