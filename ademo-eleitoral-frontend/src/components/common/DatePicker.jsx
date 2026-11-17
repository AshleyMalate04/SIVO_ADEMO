import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

export default function DatePicker({ value, onChange, ariaLabel = 'Filtrar por data' }) {
  const selectedDate = value ? parseISO(value) : null
  const initialMonth = selectedDate && isValid(selectedDate) ? selectedDate : new Date()
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(initialMonth)
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!value) return
    const nextDate = parseISO(value)
    if (isValid(nextDate)) setVisibleMonth(nextDate)
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

  const selectDate = (date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div className="date-picker" ref={pickerRef}>
      <button className="date-picker-trigger" type="button" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={17} aria-hidden="true" />
        <span className={value ? '' : 'date-picker-placeholder'}>{value && selectedDate && isValid(selectedDate) ? format(selectedDate, 'dd/MM/yyyy') : 'Seleccionar data...'}</span>
        <ChevronDown className={open ? 'date-picker-chevron open' : 'date-picker-chevron'} size={15} aria-hidden="true" />
      </button>

      {open ? (
        <section className="date-picker-popover" role="dialog" aria-label="Escolher data">
          <header className="date-picker-header">
            <button type="button" aria-label="Mês anterior" onClick={() => setVisibleMonth((current) => subMonths(current, 1))}><ChevronLeft size={18} /></button>
            <strong>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</strong>
            <button type="button" aria-label="Mês seguinte" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}><ChevronRight size={18} /></button>
          </header>
          <div className="date-picker-weekdays" aria-hidden="true">
            {weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="date-picker-days">
            {days.map((day) => {
              const isSelected = selectedDate && isValid(selectedDate) && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  className={`${isSameMonth(day, visibleMonth) ? '' : 'outside'}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`.trim()}
                  type="button"
                  key={day.toISOString()}
                  aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                  aria-pressed={Boolean(isSelected)}
                  onClick={() => selectDate(day)}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
          <footer className="date-picker-footer">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} disabled={!value}>Limpar</button>
            <button type="button" onClick={() => selectDate(new Date())}>Hoje</button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}
