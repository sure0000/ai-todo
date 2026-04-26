'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2, Plus } from 'lucide-react'

interface ParsedTodo {
  title: string
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  category_hint: string | null
  description: string | null
}

interface VoiceButtonProps {
  onParsed: (parsed: ParsedTodo, transcription: string) => void
}

export function VoiceButton({ onParsed }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    mediaRecorder.onstop = async () => {
      setProcessing(true)
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob, 'voice.webm')

      const res = await fetch('/api/todos/voice', { method: 'POST', body: formData })
      const data = await res.json()
      onParsed(data.parsed, data.transcription)
      setProcessing(false)
      stream.getTracks().forEach((t) => t.stop())
    }

    mediaRecorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      disabled={processing}
      className={`fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all md:bottom-8 md:right-8 ${
        recording
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : processing
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-indigo-500 hover:bg-indigo-600'
      }`}
      title={recording ? '停止录音' : '语音添加待办'}
    >
      {processing ? (
        <Loader2 size={24} className="text-white animate-spin" />
      ) : recording ? (
        <MicOff size={24} className="text-white" />
      ) : (
        <Mic size={24} className="text-white" />
      )}
    </button>
  )
}
