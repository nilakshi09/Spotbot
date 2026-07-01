'use client'

import { useState } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState('')

  function handleHexInput(raw: string) {
    setInputValue(raw)

    // Validate hex color
    const hex = raw.startsWith('#') ? raw : `#${raw}`
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setError('')
      onChange(hex)
    } else {
      setError('Enter a valid hex color (e.g. #6366f1)')
    }
  }

  // Preset colors
  const presets = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#1f2937', // dark
    '#f9fafb', // white
  ]

  return (
    <div>
      <label className="text-xs text-gray-500 mb-2 block">
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Color preview + native picker */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-lg border-2 border-white/20
              cursor-pointer overflow-hidden"
            style={{ backgroundColor: value }}
          >
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setInputValue(e.target.value)
              }}
              className="absolute inset-0 opacity-0 cursor-pointer
                w-full h-full"
            />
          </div>
        </div>

        {/* Hex input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder="#6366f1"
          maxLength={7}
          className={`flex-1 px-3 py-2 bg-white/5 border
            rounded-xl text-white text-sm font-mono
            placeholder:text-gray-600 outline-none
            focus:border-indigo-500 transition-colors ${
            error ? 'border-red-400' : 'border-white/10'
          }`}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* Preset swatches */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {presets.map(color => (
          <button
            key={color}
            onClick={() => {
              onChange(color)
              setInputValue(color)
              setError('')
            }}
            className={`w-6 h-6 rounded-md border-2 transition-all ${
              value === color
                ? 'border-white scale-110'
                : 'border-transparent hover:border-white/50'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
