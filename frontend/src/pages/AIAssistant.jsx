import { useEffect, useRef, useState } from 'react'
import { useProperty } from '../context/PropertyContext'
import { sendChatMessage } from '../services/endpoints'
import { EmptyState } from '../components/UI'

const SUGGESTED_QUESTIONS_EN = [
  'Why is my electricity bill high?',
  'Which appliance uses the most electricity?',
  'How can I keep my bill below ₹3000?',
  'Give me a two-month saving plan.',
]
const SUGGESTED_QUESTIONS_TA = [
  'எனது மின்சார பில் ஏன் அதிகமாக உள்ளது?',
  'எந்த உபகரணம் அதிக மின்சாரத்தை பயன்படுத்துகிறது?',
  'எனது பில்லை ₹3000க்கு கீழ் வைத்திருப்பது எப்படி?',
  'இரண்டு மாத சேமிப்பு திட்டம் தரவும்.',
]

export default function AIAssistant() {
  const { selectedProperty } = useProperty()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setListening(false)
      }
      recognition.onerror = () => setListening(false)
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : 'en-IN'
  }, [language])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text) => {
    const message = (text ?? input).trim()
    if (!message || !selectedProperty) return
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setInput('')
    setLoading(true)
    try {
      const res = await sendChatMessage({ property_id: selectedProperty.id, message, language, session_id: sessionId })
      setSessionId(res.data.session_id)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply, usedFallback: res.data.used_fallback }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  if (!selectedProperty) return <EmptyState title="Select a property first" />

  const suggestions = language === 'ta' ? SUGGESTED_QUESTIONS_TA : SUGGESTED_QUESTIONS_EN

  return (
    <div>
      <div className="page-header">
        <div className="page-title">AI Electricity Assistant — {selectedProperty.name}</div>
        <select style={{ width: 140 }} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>
      <div className="card chat-window">
        <div className="chat-messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((q) => (
                <button key={q} className="btn btn-outline btn-sm" onClick={() => handleSend(q)}>{q}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
          ))}
          {loading && <div className="chat-bubble assistant">Thinking...</div>}
        </div>
        <div className="chat-input-row">
          {voiceSupported && (
            <button type="button" className={`btn ${listening ? 'btn-danger' : 'btn-outline'}`} onClick={toggleListening} title="Voice input">
              🎤
            </button>
          )}
          <input
            placeholder={language === 'ta' ? 'உங்கள் கேள்வியை தட்டச்சு செய்யவும்...' : 'Ask about your electricity usage...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" onClick={() => handleSend()} disabled={loading}>Send</button>
        </div>
        {!voiceSupported && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
            Voice input is not supported in this browser.
          </div>
        )}
      </div>
    </div>
  )
}
