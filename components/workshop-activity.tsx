"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { WorkshopActivity } from "@/lib/workshop-types";

function Question({ activity, number }: { activity: WorkshopActivity; number?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const feedback = activity.optionFeedback?.find(item => item.option === selected);
  const recommendedChoice = activity.kind === "discuss";
  return <div className="wk-question">
    <div className="wk-question-label"><Lightbulb size={14} /><span>{activity.kind === "predict" ? "Make a prediction" : "Audience question"}</span>{number && <span>{number}</span>}</div>
    <p>{activity.question}</p>
    {activity.options && <div className="wk-options" role="group" aria-label="Choose an answer">{activity.options.map(option => <button key={option} aria-pressed={selected === option} className={selected === option ? `selected ${feedback ? feedback.correct ? "is-correct" : "is-incorrect" : ""}` : ""} onClick={() => setSelected(option)}>{option}</button>)}</div>}
    {feedback ? <div className={`wk-answer wk-choice-feedback ${feedback.correct ? "is-correct" : "is-incorrect"}`} role="status" aria-live="polite"><strong>{feedback.correct ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}<span>{feedback.correct ? recommendedChoice ? "Best fit for this scenario" : "Correct" : recommendedChoice ? "Not the best fit here" : "Not quite"}</span></strong><p>{feedback.explanation}</p>{!feedback.correct && <small>Try another answer.</small>}</div> : <><button className="wk-reveal" onClick={() => setRevealed(value => !value)} aria-expanded={revealed}>{revealed ? "Hide answer" : "Show answer"}<ArrowRight size={13} /></button>{revealed && <div className="wk-answer" role="status"><strong>{activity.answer}</strong>{activity.explanation && <p>{activity.explanation}</p>}</div>}</>}
  </div>;
}

export function WorkshopActivityPanel({ activities }: { activities: WorkshopActivity[] }) {
  const [index, setIndex] = useState(0);
  return <div className="wk-activity-panel">
    {activities.length > 1 && <div className="wk-scenario-tabs" aria-label="Practice scenarios">{activities.map((_, i) => <button key={i} aria-pressed={index === i} className={index === i ? "active" : ""} onClick={() => setIndex(i)}>Scenario {i + 1}</button>)}</div>}
    <Question key={index} activity={activities[index]} number={activities.length > 1 ? `${index + 1} / ${activities.length}` : undefined} />
  </div>;
}
