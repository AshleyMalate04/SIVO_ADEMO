import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'

const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function readDate(value) {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export default function DateTimePicker({
  value,
  min,
  onChange,
  ariaLabel = 'Seleccionar data e hora',
  placeholder = 'Seleccionar data e hora...',
}) {
  const selectedDate = readDate(value)
  const minimumDate = readDate(min)
  const fallbackDate = selectedDate || minimumDate || new Date()
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(fallbackDate)
  const [draftDate, setDraftDate] = useState(fallbackDate)
  const [draftTime, setDraftTime] = useState(format(fallbackDate, 'HH:mm'))
  const pickerRef = useRef(null)

  useEffect(() => {
    const nextSelectedDate = readDate(value)
    if (!nextSelectedDate) return
    setVisibleMonth(nextSelectedDate)
    setDraftDate(nextSelectedDate)
    setDraftTime(format(nextSelectedDate, 'HH:mm'))
  }, [value])

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutside = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 }),
  }), [visibleMonth])

  const monthLabel = format(visibleMonth, "MMMM 'de' yyyy", { locale: pt })
  const minimumTime = minimumDate && isSameDay(draftDate, minimumDate)
    ? format(minimumDate, 'HH:mm')
    : undefined

  const openPicker = () => {
    const nextDate = selectedDate || minimumDate || new Date()
    setVisibleMonth(nextDate)
    setDraftDate(nextDate)
    setDraftTime(format(nextDate, 'HH:mm'))
    setOpen((current) => !current)
  }

  const selectDate = (date) => {
    setDraftDate(date)
    if (minimumDate && isSameDay(date, minimumDate) && draftTime < format(minimumDate, 'HH:mm')) {
      setDraftTime(format(minimumDate, 'HH:mm'))
    }
  }

  const applyValue = () => {
    let nextValue = `${format(draftDate, 'yyyy-MM-dd')}T${draftTime}`
    if (minimumDate && isBefore(parseISO(nextValue), minimumDate)) {
      nextValue = format(minimumDate, "yyyy-MM-dd'T'HH:mm")
    }
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className="date-time-picker" ref={pickerRef}>
      <button
        className="date-time-picker-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openPicker}
      >
        <CalendarDays size={18} aria-hidden="true" />
        <span className={selectedDate ? '' : 'date-picker-placeholder'}>
          {selectedDate ? format(selectedDate, "dd/MM/yyyy 'às' HH:mm") : placeholder}
        </span>
        <ChevronDown className={open ? 'date-picker-chevron open' : 'date-picker-chevron'} size={15} aria-hidden="true" />
      </button>

      {open ? (
        <section className="date-time-picker-popover" role="dialog" aria-label={ariaLabel}>
          <header className="date-picker-header">
            <button type="button" aria-label="Mês anterior" onClick={() => setVisibleMonth((current) => subMonths(current, 1))}>
              <ChevronLeft size={18} />
            </button>
            <strong>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</strong>
            <button type="button" aria-label="Mês seguinte" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
              <ChevronRight size={18} />
            </button>
          </header>

          <div className="date-picker-weekdays" aria-hidden="true">
            {weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="date-picker-days">
            {days.map((day) => {
              const disabled = minimumDate && isBefore(startOfDay(day), startOfDay(minimumDate))
              const selected = isSameDay(day, draftDate)
              const today = isSameDay(day, new Date())
              return (
                <button
                  className={`${isSameMonth(day, visibleMonth) ? '' : 'outside'}${selected ? ' selected' : ''}${today ? ' today' : ''}`.trim()}
                  type="button"
                  key={day.toISOString()}
                  aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => selectDate(day)}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          <label className="date-time-field">
            <span><Clock3 size={16} aria-hidden="true" /> Hora</span>
            <input type="time" value={draftTime} min={minimumTime} onChange={(event) => setDraftTime(event.target.value)} />
          </label>

          <footer className="date-time-picker-footer">
            <button className="date-time-clear" type="button" onClick={() => { onChange(''); setOpen(false) }} disabled={!value}>Limpar</button>
            <button className="date-time-apply" type="button" onClick={applyValue}><Check size={16} /> Aplicar</button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}
