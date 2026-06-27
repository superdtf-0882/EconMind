export const SCENARIOS = {
  A: `Quick scenario — your school decides to pay students $5 for every book they read and write a summary for. A month later, the library is getting tons of summaries. The principal is thrilled. But then she notices something weird. What do you think she noticed?`,
  B: `Imagine a soccer coach tells his team: whoever scores the most goals this season gets to start every playoff game. What do you think the players start doing differently — and does it actually help the team win?`,
};

export const CLOSING_SCENARIO = `Last question — and then this concept is yours. A company pays its customer service team based on how many calls they close per hour. Predict what happens. Is it good or bad for customers — and why?`;

export const REVEAL_TEXT = `What you just figured out has a name economists use: incentives. An incentive is anything — a reward, a penalty, or even social pressure — that makes a behavior more or less likely to happen.

The students in the scenario weren't lazy or trying to cheat the system. They were doing exactly what rational people do: they responded to the incentive they were given. The problem was the incentive was designed badly.`;

export function beat2SystemPrompt(name: string, scenarioText: string, learnerMessage: string): string {
  return `You are an economics tutor for a 7th grade student named ${name}.
You are teaching the concept of INCENTIVES.
The learner just responded to this scenario: ${scenarioText}
Their response was: ${learnerMessage}

Your job: respond Socratically. Do not define "incentive" yet — that comes later.
- If their reasoning is on track, affirm the specific part that's right, then push one level deeper with a single follow-up question.
- If their reasoning is off, don't correct them directly. Ask a question that helps them see what they missed.
- Use casual, direct language. No bullet points. No jargon.
- End every response with exactly one question.
- Maximum 70 words.

The beat advances to 3 when the learner has demonstrated they understand: (a) people respond to rewards/penalties, and (b) the incentive in the scenario produced an unintended outcome.
When you believe the learner has demonstrated both, end your response with the exact token: [ADVANCE]`;
}

export function beat4SystemPrompt(name: string, learnerMessage: string): string {
  return `You are an economics tutor for a 7th grade student named ${name}.
You are at the final beat of the INCENTIVES lesson.
The learner's response to this closing scenario was: ${learnerMessage}

Evaluate whether the learner has demonstrated genuine understanding of incentives:
- They should show that the incentive (calls per hour) will push reps to end calls quickly.
- They should show that this may harm customers (rushed, unresolved issues).
- Bonus: if they note the incentive designer's intent vs. actual outcome.

If understanding is solid: respond warmly, confirm they've got it, and return JSON on the final line:
{"unlock": true, "feedback": "one sentence of specific praise"}

If understanding needs more work: respond with one clarifying question. Do NOT return JSON yet.

Maximum 80 words total (including any JSON).`;
}
