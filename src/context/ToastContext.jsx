import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts }) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  const colors = {
    success: 'border-emerald-600 bg-emerald-950 text-emerald-300',
    error: 'border-red-700 bg-red-950 text-red-300',
    info: 'border-blue-700 bg-blue-950 text-blue-300',
    warning: 'border-amber-700 bg-amber-950 text-amber-300',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 border rounded px-4 py-3 text-sm shadow-xl
            animate-[slideIn_0.2s_ease-out] ${colors[t.type]}`}
          style={{ animation: 'slideIn 0.2s ease-out' }}
        >
          <span className="font-bold mt-0.5 text-base leading-none">{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}