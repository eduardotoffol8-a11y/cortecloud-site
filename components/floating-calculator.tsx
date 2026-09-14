"use client";

import { Calculator as CalculatorIcon, Delete, Divide, Equal, Maximize2, Minimize2, Minus, Percent, X } from "lucide-react";
import { useRef, useState } from "react";

type Operator = "+" | "-" | "×" | "÷";
type Position = { x: number; y: number };

const POSITION_KEY = "orcamovel.calculator-position.v1";

function calculate(left: number, right: number, operator: Operator) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "×") return left * right;
  return right === 0 ? Number.NaN : left / right;
}

function resultText(value: number) {
  if (!Number.isFinite(value)) return "Erro";
  const rounded = Number(value.toPrecision(12));
  return String(rounded).replace(".", ",");
}

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForNumber, setWaitingForNumber] = useState(false);
  const [position, setPosition] = useState<Position | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(POSITION_KEY) || "null") as Position | null; } catch { return null; }
  });
  const drag = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const currentNumber = () => Number(display.replace(",", "."));
  const enterDigit = (digit: string) => {
    if (display === "Erro" || waitingForNumber) {
      setDisplay(digit);
      setWaitingForNumber(false);
    } else setDisplay((value) => value === "0" ? digit : value.length < 14 ? `${value}${digit}` : value);
  };
  const enterDecimal = () => {
    if (display === "Erro" || waitingForNumber) {
      setDisplay("0,");
      setWaitingForNumber(false);
    } else if (!display.includes(",")) setDisplay((value) => `${value},`);
  };
  const chooseOperator = (nextOperator: Operator) => {
    const value = currentNumber();
    if (!Number.isFinite(value)) return clear();
    if (storedValue !== null && operator && !waitingForNumber) {
      const result = calculate(storedValue, value, operator);
      setDisplay(resultText(result));
      setStoredValue(Number.isFinite(result) ? result : null);
    } else setStoredValue(value);
    setOperator(nextOperator);
    setWaitingForNumber(true);
  };
  const equals = () => {
    if (storedValue === null || !operator) return;
    const result = calculate(storedValue, currentNumber(), operator);
    setDisplay(resultText(result));
    setStoredValue(null);
    setOperator(null);
    setWaitingForNumber(true);
  };
  const clear = () => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setWaitingForNumber(false);
  };
  const backspace = () => {
    if (waitingForNumber || display === "Erro") return clear();
    setDisplay((value) => value.length <= 1 ? "0" : value.slice(0, -1));
  };
  const percentage = () => setDisplay(resultText(currentNumber() / 100));

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (maximized || (event.target as HTMLElement).closest("button")) return;
    const box = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!box) return;
    drag.current = { offsetX: event.clientX - box.left, offsetY: event.clientY - box.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const width = event.currentTarget.parentElement?.offsetWidth || 320;
    const height = event.currentTarget.parentElement?.offsetHeight || 500;
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - drag.current.offsetX)),
      y: Math.max(76, Math.min(window.innerHeight - height - 82, event.clientY - drag.current.offsetY)),
    });
  };
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (position) localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} aria-label="Abrir calculadora" title="Calculadora" className="fixed bottom-[5.8rem] right-3 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/50 bg-[var(--brand)] text-white shadow-[0_8px_24px_rgba(20,45,41,.24)] transition-transform hover:scale-105"><CalculatorIcon size={19} /></button>;

  const panelStyle = !maximized && position ? { left: position.x, top: position.y } : !maximized ? { right: 12, bottom: 92 } : undefined;
  const numberButton = "grid min-h-14 place-items-center rounded-2xl bg-[#f1f4f3] text-[1.35rem] font-semibold text-[#172321] transition-colors active:bg-[#dce5e2]";
  const actionButton = "grid min-h-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-xl font-bold text-[var(--brand)] transition-colors active:opacity-70";

  return <section role="dialog" aria-label="Calculadora flutuante" style={panelStyle} className={`fixed z-50 flex flex-col overflow-hidden rounded-[1.75rem] border border-[#d5e1de] bg-white shadow-[0_24px_65px_rgba(15,35,31,.28)] ${maximized ? "bottom-[5.6rem] left-3 right-3 top-20 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[620px] sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2" : "h-[500px] w-[min(320px,calc(100vw-24px))]"}`}>
    <div onPointerDown={startDrag} onPointerMove={move} onPointerUp={finishDrag} onPointerCancel={finishDrag} className="flex touch-none cursor-move items-center justify-between border-b border-[#e3ebe9] bg-[#f8faf9] px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-extrabold text-[#33433f]"><CalculatorIcon size={17} className="text-[var(--brand)]" />Calculadora</div>
      <div className="flex gap-1"><button type="button" onClick={() => setMaximized((value) => !value)} className="quiet-button !min-h-9 !w-9 !p-0" aria-label={maximized ? "Restaurar calculadora" : "Maximizar calculadora"}>{maximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button><button type="button" onClick={() => { setOpen(false); setMaximized(false); }} className="quiet-button !min-h-9 !w-9 !p-0" aria-label="Minimizar calculadora"><Minus size={18} /></button></div>
    </div>
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
      <div className="mb-3 flex min-h-24 flex-col items-end justify-end overflow-hidden rounded-2xl bg-[var(--brand-dark)] px-5 py-4 text-white"><span className="min-h-5 text-sm text-white/55">{storedValue !== null && operator ? `${resultText(storedValue)} ${operator}` : ""}</span><output className="block max-w-full truncate text-right text-[2.45rem] font-medium leading-tight tracking-[-0.04em]">{display}</output></div>
      <div className="grid flex-1 grid-cols-4 gap-2">
        <button type="button" onClick={clear} className={actionButton}>C</button><button type="button" onClick={backspace} aria-label="Apagar último número" className={actionButton}><Delete size={22} /></button><button type="button" onClick={percentage} aria-label="Porcentagem" className={actionButton}><Percent size={21} /></button><button type="button" onClick={() => chooseOperator("÷")} aria-label="Dividir" className={actionButton}><Divide size={22} /></button>
        {["7", "8", "9"].map((number) => <button type="button" key={number} onClick={() => enterDigit(number)} className={numberButton}>{number}</button>)}<button type="button" onClick={() => chooseOperator("×")} aria-label="Multiplicar" className={actionButton}><X size={22} /></button>
        {["4", "5", "6"].map((number) => <button type="button" key={number} onClick={() => enterDigit(number)} className={numberButton}>{number}</button>)}<button type="button" onClick={() => chooseOperator("-")} aria-label="Subtrair" className={actionButton}><Minus size={22} /></button>
        {["1", "2", "3"].map((number) => <button type="button" key={number} onClick={() => enterDigit(number)} className={numberButton}>{number}</button>)}<button type="button" onClick={() => chooseOperator("+")} aria-label="Somar" className={actionButton}>+</button>
        <button type="button" onClick={() => enterDigit("0")} className={`${numberButton} col-span-2`}>0</button><button type="button" onClick={enterDecimal} aria-label="Vírgula decimal" className={numberButton}>,</button><button type="button" onClick={equals} aria-label="Calcular resultado" className="grid min-h-14 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-md active:opacity-80"><Equal size={24} /></button>
      </div>
    </div>
  </section>;
}
