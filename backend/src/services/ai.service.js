
// Gemini model — configurable via GEMINI_MODEL env var.
// Default 'gemini-3.6-flash' verified against the live Gemini API (the
// previously used gemini-2.0-flash has been decommissioned).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// @google/genai ships ESM-first types/runtime, so it must be imported
// dynamically from this CommonJS module. The client is created lazily and
// cached; only initialized when the user has a valid GEMINI_API_KEY.
let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    const hasKey =
      !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
    geminiClient = hasKey
      ? import('@google/genai').then(
          ({ GoogleGenAI }) => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        )
      : Promise.resolve(null);
  }
  return geminiClient;
}

const DEMO_MODE =
  process.env.AI_DEMO_MODE === 'true' ||
  !(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here');

// ==================== Upcoming Deadline Context ====================
// Task.dueDate is the primary source of "upcoming deadline" data (matches the
// Calendar). Separate Deadline documents are merged in only when they are not
// already represented by a linked active Task. Deduplication uses real IDs
// (Task._id / Deadline._id / Deadline.relatedTasks) — never titles.
function buildUpcomingDeadlineContext(
  now,
  tasks,
  deadlines,
  cap = 8
) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const inWindow = (d) => {
    const daysUntil = (new Date(d).getTime() - now.getTime()) / MS_PER_DAY;
    return daysUntil >= 0 && daysUntil <= 7;
  };

  const items = [];
  const seen = new Set();
  const activeTaskIds = new Set();

  for (const t of tasks) {
    if (t.status === 'completed' || !inWindow(t.dueDate)) continue;
    const id = String(t._id);
    activeTaskIds.add(id);
    if (!seen.has(id)) {
      seen.add(id);
      items.push({
        id,
        title: t.title,
        dueDate: new Date(t.dueDate),
        status: t.status || 'pending',
        source: 'task',
        taskId: id,
      });
    }
  }

  for (const d of deadlines) {
    if (d.status && d.status !== 'upcoming') continue;
    if (!inWindow(d.dueDate)) continue;
    const related = (d.relatedTasks || []).map((r) => String(r?._id ?? r));
    if (related.some((rid) => activeTaskIds.has(rid))) continue;
    const id = String(d._id);
    if (!seen.has(id)) {
      seen.add(id);
      items.push({
        id,
        title: d.title,
        dueDate: new Date(d.dueDate),
        status: d.status || 'upcoming',
        source: 'deadline',
        deadlineId: id,
      });
    }
  }

  items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return { items: items.slice(0, cap), total: items.length };
}

// ==================== AI Service Class ====================

class AIService {
  // ========== Core AI Helpers ==========

  // Timeout wrapper to avoid hanging requests on slow/failed Gemini calls
  withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timed out')), ms)
      ),
    ]);
  }

  // Parse Gemini JSON responses robustly (strips markdown fences if present)
  parseGeminiJson(text) {
    try {
      let cleaned = (text || '').trim();
      const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(cleaned);
      if (fence) cleaned = fence[1].trim();

      const obj = cleaned.match(/^\{[\s\S]*\}$/);
      const arr = cleaned.match(/^\[[\s\S]*\]$/);
      const jsonText = obj ? obj[0] : arr ? arr[0] : cleaned;
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('parseGeminiJson failed:', error);
      return null;
    }
  }

  // Type guards used by all AI methods to prevent malformed Gemini responses
  // (e.g., objects where strings are expected) from reaching React and
  // triggering "Minified React error #31: Objects are not valid as a React child".
  isString(v) { return typeof v === 'string'; }
  isNumber(v) { return typeof v === 'number' && !Number.isNaN(v); }
  isOneOf(v, allowed) {
    return typeof v === 'string' && allowed.includes(v);
  }
  allStrings(v) {
    return Array.isArray(v) && v.every((x) => typeof x === 'string');
  }

  // Run a Gemini JSON request; returns null on parse failure so callers can
  // fall back to mocks when their !result validation triggers
  async generateJson(prompt, maxOutputTokens) {
    const tStart = Date.now();
    const promptTokens = Math.ceil((prompt || '').length / 4);
    console.log(`[AI][generateJson] START prompt~${promptTokens}toks model=${GEMINI_MODEL}`);

    const client = await getGeminiClient();
    if (!client) throw new Error('Gemini client not configured');
    console.log(`[AI][generateJson] client_ready in ${Date.now() - tStart}ms`);

    const tGemini = Date.now();
    const generateConfig = {
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', temperature: 0.4 },
    };
    if (maxOutputTokens !== undefined) {
      generateConfig.config.maxOutputTokens = maxOutputTokens;
    }
    const response = await this.withTimeout(
      client.models.generateContent(generateConfig),
      30000
    );
    console.log(`[AI][generateJson] GEMINI_RETURNED in ${Date.now() - tGemini}ms responseLen=${(response.text || '').length}`);

    const parsed = this.parseGeminiJson(response.text || '');
    console.log(`[AI][generateJson] TOTAL ${Date.now() - tStart}ms parsed=${parsed ? 'ok' : 'null'}`);
    return parsed;
  }

  // ========== Core AI Methods ==========

  // Calculate deadline risk score
  async calculateDeadlineRisk(task, userHistory) {
    if (DEMO_MODE) {
      return this.mockRiskPrediction(task);
    }

    try {
      // Optimized prompt: compact format, only essential fields.
      // Sends minimum necessary task information to Gemini; Gemini responsible
      // for meaningful risk interpretation/explanation. Output token limit ensures
      // complete RiskPrediction JSON is never truncated.
      const prompt = `Risk of missing deadline: Task="${task.title}", Due=${task.dueDate}, Priority=${task.priority}, Hours=${task.estimatedHours}. Provide riskScore (0-100), riskLevel (low|medium|high|critical), 3 key factors, and recommendation. Return ONLY valid JSON.`;

      const result = await this.generateJson(prompt, 50);
      if (
        !result ||
        typeof result.riskScore !== 'number' ||
        !this.isOneOf(result.riskLevel, ['low', 'medium', 'high', 'critical']) ||
        !this.allStrings(result.factors) ||
        !this.isString(result.recommendation)
      ) {
        throw new Error('Malformed risk prediction response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockRiskPrediction(task);
    }
  }

  // Generate smart daily plan
  async generateDailyPlan(tasks, availableHours = 8) {
    if (DEMO_MODE) {
      return this.mockDailyPlan(tasks, availableHours);
    }

    try {
      // Safety cap: serialize at most 20 relevant tasks into the prompt
      const promptTasks = tasks.slice(0, 20);
      const prompt = `Create an optimal daily schedule for these tasks:
Available Hours: ${availableHours}
Tasks: ${JSON.stringify(promptTasks.map(t => ({ title: t.title, hours: t.estimatedHours, priority: t.priority, due: t.dueDate })))}

Return a time-blocked schedule in JSON format.`;

      const result = await this.generateJson(prompt);
      if (
        !Array.isArray(result) ||
        !result.every(
          (it) =>
            this.isString(it?.title) &&
            this.isNumber(it?.estimatedHours) &&
            this.isString(it?.priority)
        )
      ) {
        throw new Error('Malformed daily plan response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockDailyPlan(tasks, availableHours);
    }
  }

  // Break down task into subtasks
  async breakDownTask(title, description, estimatedHours) {
    if (DEMO_MODE) {
      return this.mockTaskBreakdown(title, description, estimatedHours);
    }

    try {
      const prompt = `Break down this task into manageable subtasks:
Task: ${title}
Description: ${description}
Total Estimated Hours: ${estimatedHours}

Return JSON with subtasks array, each having title, description, estimatedHours, and order.`;

      const result = await this.generateJson(prompt);
      if (
        !result ||
        !Array.isArray(result.subtasks) ||
        !result.subtasks.every(
          (s) =>
            this.isString(s?.title) &&
            (typeof s?.description === 'string' || s?.description == null)
        )
      ) {
        throw new Error('Malformed task breakdown response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockTaskBreakdown(title, description, estimatedHours);
    }
  }

  // Recommend next action
  async recommendNextAction(tasks, currentTime) {
    if (DEMO_MODE) {
      return this.mockNextAction(tasks);
    }

    try {
      // Safety cap: serialize at most 20 relevant tasks into the prompt
      const promptTasks = tasks.slice(0, 20);
      const prompt = `Based on these pending tasks, what should the user work on NEXT?
Current Time: ${currentTime || new Date()}
Tasks: ${JSON.stringify(promptTasks.map(t => ({ title: t.title, due: t.dueDate, priority: t.priority, hours: t.estimatedHours })))}

Return JSON with taskId, title, reason, urgency, and estimatedImpact.`;

      const result = await this.generateJson(prompt);
      if (
        !result ||
        !this.isString(result.title) ||
        !this.isString(result.reason) ||
        !this.isString(result.estimatedImpact) ||
        !this.isOneOf(result.urgency, ['low', 'medium', 'high', 'critical'])
      ) {
        throw new Error('Malformed next action response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockNextAction(tasks);
    }
  }

  // Detect burnout risk
  async detectBurnout(tasks, deadlines, userStats) {
    if (DEMO_MODE) {
      return this.mockBurnoutDetection(tasks, deadlines);
    }

    try {
      // Safety cap: serialize at most 20 relevant tasks into the prompt.
      // Total Tasks count intentionally reflects the full workload passed in.
      const promptTasks = tasks.slice(0, 20);
      const prompt = `Analyze burnout risk based on:
Total Tasks: ${tasks.length}
Upcoming Deadlines (7 days): ${deadlines.length}
Tasks: ${JSON.stringify(promptTasks.map(t => ({ title: t.title, due: t.dueDate, hours: t.estimatedHours })))}
Deadlines: ${JSON.stringify(deadlines.slice(0, 20).map(d => ({ title: d.title, due: d.dueDate, status: d.status })))}

Return JSON with riskLevel, workloadScore, deadlinePressure, recommendations array, and suggestedBreak.`;

      const result = await this.generateJson(prompt);
      if (
        !result ||
        typeof result.workloadScore !== 'number' ||
        !this.isNumber(result.deadlinePressure) ||
        !this.isOneOf(result.riskLevel, ['low', 'medium', 'high', 'critical']) ||
        !this.allStrings(result.recommendations) ||
        !this.isString(result.suggestedBreak)
      ) {
        throw new Error('Malformed burnout response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockBurnoutDetection(tasks, deadlines);
    }
  }

  // Simulate deadline change impact
  async simulateDeadlineChange(
    task,
    newDate,
    allTasks
  ) {
    if (DEMO_MODE) {
      return this.mockDeadlineSimulation(task, newDate, allTasks);
    }

try {
      // Optimized prompt: compact format, only essential context.
      // Sends minimum necessary context to Gemini; Gemini responsible for contextual
      // consequences/recommendations. Output token limit ensures complete
      // DeadlineSimulation JSON is never truncated.
      const prompt = `Deadline impact: Task="${task.title}", Current=${task.dueDate}, New=${newDate}, OtherTasks=${allTasks.length}. Return JSON: originalRisk (0-100), newRisk (0-100), impactOnOtherTasks (2-3 short strings), workloadChange (%), recommendation. Return ONLY valid JSON.`;

      const result = await this.generateJson(prompt, 55);
      if (
        !result ||
        typeof result.originalRisk !== 'number' ||
        typeof result.newRisk !== 'number' ||
        !this.allStrings(result.impactOnOtherTasks) ||
        !this.isNumber(result.workloadChange) ||
        !this.isString(result.recommendation)
      ) {
        throw new Error('Malformed deadline simulation response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockDeadlineSimulation(task, newDate, allTasks);
    }
  }

  // Generate weekly report
  async generateWeeklyReport(stats) {
    if (DEMO_MODE) {
      return this.mockWeeklyReport(stats);
    }

    try {
      const prompt = `Generate a weekly productivity report:
${JSON.stringify(stats)}

Return JSON with completedTasks, missedTasks, streak, productivityChange, achievements array, insights, and nextWeekFocus.`;

      const result = await this.generateJson(prompt);
      if (
        !result ||
        typeof result.completedTasks !== 'number' ||
        !this.isString(result.insights) ||
        !this.isString(result.nextWeekFocus) ||
        !this.allStrings(result.achievements)
      ) {
        throw new Error('Malformed weekly report response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockWeeklyReport(stats);
    }
  }

  // Activate emergency mode
  async activateEmergencyMode(tasks, deadlines) {
    if (DEMO_MODE) {
      return this.mockEmergencyMode(tasks, deadlines);
    }

    try {
      // Safety cap: serialize at most 20 relevant tasks into the prompt
      const promptTasks = tasks.slice(0, 20);
      const prompt = `EMERGENCY MODE: User has critical deadlines approaching.
Tasks: ${JSON.stringify(promptTasks.map(t => ({ title: t.title, due: t.dueDate, priority: t.priority, hours: t.estimatedHours })))}

Return JSON with prioritizedTasks array, studyPlan array, and criticalWarning.`;

      const result = await this.generateJson(prompt);
      if (
        !result ||
        !Array.isArray(result.prioritizedTasks) ||
        !this.allStrings(result.studyPlan) ||
        !this.isString(result.criticalWarning) ||
        !result.prioritizedTasks.every(
          (t) =>
            this.isString(t?.title) &&
            this.isString(t?.reason) &&
            this.isString(t?.timeAllocation)
        )
      ) {
        throw new Error('Malformed emergency plan response');
      }
      return result;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockEmergencyMode(tasks, deadlines);
    }
  }

  // ========== Chatbot (Central AI Interface) ==========

  // Backward-compatible entry point (delegates to the new chat pipeline)
  async generateChatResponse(message, context) {
    return this.processChatMessage(message, context);
  }

  // Main chat pipeline: classify intent, run the matching feature on real data,
  // then use a deterministic reply built from the same real data.
  // The former second Gemini narration call was removed to halve latency.
  async processChatMessage(message, context) {
    const trimmed = (message || '').trim();
    const intent = this.detectChatIntent(trimmed, context);

    if (DEMO_MODE) {
      return this.fallbackChatReply(intent, trimmed, context);
    }

    try {
      const payload = await this.buildIntentPayload(intent, trimmed, context);
      // USE DETERMINISTIC FALLBACK INSTEAD OF A SECOND GEMINI CALL.
      // The former Gemini narration call duplicated work already done by
      // buildIntentPayload(); falling back to a data-driven reply preserves
      // readability while cutting one sequential Gemini API request.
      return this.fallbackChatReply(intent, trimmed, context);
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      return this.fallbackChatReply(intent, trimmed, context);
    }
  }

  // Deterministic, prioritized intent classification.
  // Order matters: strongest/most specific signals are checked first, and bare
  // words like "today" are deliberately NOT treated as planning requests.
  detectChatIntent(message, context) {
    const m = message.toLowerCase();

    // 1) Emergency — strongest signal
    if (/\b(emergency|urgent deadline|crisis mode|do or die|must finish now|desperate)\b/.test(m)) {
      return 'emergency';
    }

    // 2) Deadline simulator — explicit move/postpone/reschedule language
    if (/\b(what if|what happens if|postpone|reschedule|move (the )?(deadline|due date)|delay (the )?(deadline|due date)|push (it|the deadline) (back|out)|shift the deadline)\b/.test(m)) {
      return 'simulator';
    }

    // 3) Task breakdown
    if (/\b(break down|breakdown|break it down|split (it|this task)? into|divide into|subtask|decompose)\b/.test(m)) {
      return 'breakdown';
    }

    // 4) Risk — missing/deadline risk (checked before generic "risk" phrases)
    if (/\b(risks?|at risk|risk of miss|going to miss|miss(ing)? (a )?deadline|fall behind|behind schedule|deadline risk|miss it)\b/.test(m)) {
      return 'risk';
    }

    // 5) Burnout / overload
    if (/\b(burnout|burned out|overload|overwhelm|overworked|too much (work|on my plate)|stressed?|exhausted|can'?t cope|workload|mentally done)\b/.test(m)) {
      return 'burnout';
    }

    // 6) Next action / prioritization
    if (/\b(what should i (do|work on|start)|what do i do (next|first)|next action|where (do|should) i (start|begin)|what'?s next|most urgent|priorit(y|ize))\b/.test(m)) {
      return 'next-action';
    }

    // 7) Daily planning — requires an explicit planning phrase ("today" alone is not enough)
    if (/\b(plan (my|the|today'?s)? day|plan for today|make (me )?a plan|daily plan|schedule (me |my day)?|organize my (day|tasks)|what'?s my day look like)\b/.test(m)) {
      return 'daily-plan';
    }

    // 8) Weekly report / performance
    if (/\b(how (did|do) i (do|perform)|how i performed|how was my week|how am i doing|weekly report|weekly progress|this week|last week|my progress|performance)\b/.test(m)) {
      return 'weekly-report';
    }

    return 'general';
  }

  // Pick the most relevant task from a chat message by matching title keywords.
  // Falls back to the most urgent active task when no clear match exists.
  resolveTaskFromMessage(tasks, message) {
    const active = tasks.filter(t => t.status !== 'completed');
    if (active.length === 0) return null;

    const byDue = (a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    const mostUrgent = [...active].sort(byDue)[0];

    const words = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const stop = new Set([
      'what', 'should', 'please', 'help', 'about', 'with', 'the', 'and', 'for', 'this', 'that',
      'my', 'can', 'you', 'tell', 'show', 'me', 'break', 'down', 'task', 'tasks', 'deadline',
      'deadlines', 'plan', 'schedule', 'risk', 'project', 'work', 'on', 'first', 'next', 'i',
      'is', 'are', 'am', 'do', 'does', 'get', 'give', 'have', 'how', 'why', 'when', 'where',
      'need', 'want', 'would', 'will', 'any', 'going', 'miss', 'move', 'urgent', 'date',
    ]);
    const sig = words.filter(w => !stop.has(w));
    if (sig.length === 0) return mostUrgent;

    let best = null;
    let bestScore = 0;
    for (const t of active) {
      const title = (t.title || '').toLowerCase();
      let score = 0;
      for (const w of sig) {
        if (title.includes(w)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best && bestScore > 0 ? best : mostUrgent;
  }

  // Best-effort date extraction from a chat message (deterministic; defaults to +3 days)
  extractDateFromMessage(message, fallbackDue) {
    const m = message.toLowerCase();
    const now = new Date();

    if (/\btomorrow\b/.test(m)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (/\bnext week\b/.test(m)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d;
    }
    const inDays = m.match(/\bin\s+(\d+)\s+days?\b/);
    if (inDays) {
      const d = new Date(now);
      d.setDate(d.getDate() + parseInt(inDays[1], 10));
      return d;
    }
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const moDay = m.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/);
    if (moDay) {
      const d = new Date(now.getFullYear(), months[moDay[1]], parseInt(moDay[2], 10));
      if (d.getTime() < now.getTime()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    const numeric = m.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
    if (numeric) {
      const d = new Date(now.getFullYear(), parseInt(numeric[1], 10) - 1, parseInt(numeric[2], 10));
      if (d.getTime() < now.getTime()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }

    const d = new Date(fallbackDue);
    d.setDate(d.getDate() + 3);
    return d;
  }

  // Run the existing feature method that matches the detected intent
  async buildIntentPayload(intent, message, context) {
    const tasks = context.tasks || [];
    const deadlines = context.deadlines || [];
    const user = context.user || { streak: 0, level: 1, points: 0 };

    switch (intent) {
      case 'next-action':
        return { intent, result: await this.recommendNextAction(tasks) };

      case 'daily-plan':
        return { intent, result: await this.generateDailyPlan(tasks, 8) };

      case 'breakdown': {
        const target = this.resolveTaskFromMessage(tasks, message);
        return target
          ? { intent, task: target.title, result: await this.breakDownTask(target.title, target.description || '', target.estimatedHours) }
          : { intent, result: null, note: 'No active task to break down.' };
      }

      case 'risk': {
        const target = this.resolveTaskFromMessage(tasks, message);
        const fallback = [...tasks]
          .filter(t => t.status !== 'completed')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        const chosen = target || fallback;
        return chosen
          ? { intent, task: chosen.title, result: await this.calculateDeadlineRisk(chosen) }
          : { intent, result: null, note: 'No tasks to assess.' };
      }

      case 'burnout':
        return { intent, result: await this.detectBurnout(tasks, deadlines, user) };

      case 'emergency':
        return { intent, result: await this.activateEmergencyMode(tasks, deadlines) };

      case 'simulator': {
        const target = this.resolveTaskFromMessage(tasks, message);
        if (!target) return { intent, result: null, note: 'Which task would you like to move?' };
        const newDate = this.extractDateFromMessage(message, target.dueDate);
        return { intent, task: target.title, newDate, result: await this.simulateDeadlineChange(target, newDate, tasks) };
      }

      case 'weekly-report': {
        const weekly = context.weekly || { completed: 0, missed: 0 };
        return {
          intent,
          result: await this.generateWeeklyReport({
            completedTasks: weekly.completed,
            missedTasks: weekly.missed,
            streak: user.streak || 0,
          }),
        };
      }

      default:
        return {
          intent: 'general',
          pendingTasks: tasks.length,
          upcomingDeadlines: deadlines.length,
          streak: user.streak || 0,
          level: user.level || 1,
          points: user.points || 0,
        };
    }
  }

  // Rule-based natural-language reply built from the user's real data.
  // Used when Gemini is unavailable (DEMO_MODE or API error) so the chatbot
  // still answers meaningfully instead of failing.
  fallbackChatReply(intent, message, context) {
    const tasks = context.tasks || [];
    const deadlines = context.deadlines || [];
    const user = context.user || { streak: 0, level: 1, points: 0 };
    const active = tasks.filter(t => t.status !== 'completed');

    switch (intent) {
      case 'next-action': {
        const action = this.mockNextAction(active);
        if (!action.taskId) return "You're all caught up — no pending tasks. Enjoy the calm!";
        return `Based on your deadlines, your next action should be "${action.title}". ${action.reason} (${action.urgency}). ${action.estimatedImpact}`;
      }

      case 'daily-plan': {
        if (active.length === 0) return 'You have no pending tasks to schedule today.';
        const plan = this.mockDailyPlan(active, 8);
        const lines = plan.map(p => `• ${p.title} — ${p.timeSlot || p.estimatedHours + 'h'} (${p.reason})`);
        return `Here's a suggested plan for today:\n${lines.join('\n')}`;
      }

      case 'breakdown': {
        const target = this.resolveTaskFromMessage(tasks, message);
        if (!target) return "I don't see an active task to break down. Create one first, then ask me again.";
        const bd = this.mockTaskBreakdown(target.title, target.description || '', target.estimatedHours);
        const lines = bd.subtasks.map(s => `• #${s.order} ${s.title}: ${s.description} (~${s.estimatedHours}h)`);
        return `Here's how I'd break down "${target.title}" into ${bd.subtasks.length} subtasks:\n${lines.join('\n')}`;
      }

      case 'risk': {
        const risky = [...active].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        if (!risky) return 'No active tasks — nothing at risk right now.';
        const target = this.resolveTaskFromMessage(tasks, message) || risky;
        const r = this.mockRiskPrediction(target);
        return `The highest-risk deadline is "${target.title}" — ${r.riskLevel.toUpperCase()} risk (score ${r.riskScore}). ${r.factors.join('; ')} ${r.recommendation}`;
      }

      case 'burnout': {
        if (active.length === 0) return 'No active tasks — no workload pressure right now.';
        const report = this.mockBurnoutDetection(active, deadlines);
        return `Burnout check: risk level ${report.riskLevel.toUpperCase()} (workload score ${report.workloadScore}%, ${report.deadlinePressure} deadline(s) within 7 days).\n• ${report.recommendations.join('\n• ')}\n${report.suggestedBreak}`;
      }

      case 'emergency': {
        if (active.length === 0) return "There's nothing urgent right now — no active tasks.";
        const plan = this.mockEmergencyMode(active, deadlines);
        const lines = plan.prioritizedTasks.map(t => `#${t.priority} ${t.title} — ${t.timeAllocation} (${t.reason})`);
        return `${plan.criticalWarning}\nPriorities:\n${lines.join('\n')}\nStudy plan:\n${plan.studyPlan.join('\n')}`;
      }

      case 'simulator': {
        const target = this.resolveTaskFromMessage(tasks, message);
        if (!target) return 'Which task would you like to move, and to what date?';
        const newDate = this.extractDateFromMessage(message, target.dueDate);
        const sim = this.mockDeadlineSimulation(target, newDate, active);
        return `If you moved "${target.title}" to ${newDate.toDateString()}:\n• Risk: ${sim.originalRisk}% → ${sim.newRisk}%\n${sim.impactOnOtherTasks.map(i => `• ${i}`).join('\n')}\n${sim.recommendation}`;
      }

      case 'weekly-report': {
        const weekly = context.weekly || { completed: 0, missed: 0 };
        const report = this.mockWeeklyReport({ completedTasks: weekly.completed, missedTasks: weekly.missed, streak: user.streak || 0 });
        const delta = report.productivityChange >= 0 ? '+' : '';
        return `Weekly report: ${report.completedTasks} completed, ${report.missedTasks} missed, streak ${report.streak}, productivity change ${delta}${report.productivityChange}%.\n${report.insights}\nNext week: ${report.nextWeekFocus}`;
      }

      default:
        return this.mockChatResponse(message, {
          pendingTasks: active.length,
          upcomingDeadlines: deadlines.length,
          tasks: tasks,
          deadlines: deadlines,
          userStreak: user.streak || 0,
          userLevel: user.level || 1,
        });
    }
  }

  // ========== Legacy Methods (Enhanced) ==========

  // Calculate priority score (0-100) based on multiple factors
  calculatePriorityScore(taskData) {
    const now = new Date();
    const dueDate = new Date(taskData.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Factor 1: Time urgency (0-40 points)
    let timeScore = 0;
    if (hoursUntilDue <= 24) {
      timeScore = 40;
    } else if (hoursUntilDue <= 48) {
      timeScore = 35;
    } else if (hoursUntilDue <= 72) {
      timeScore = 30;
    } else if (hoursUntilDue <= 168) {
      timeScore = 20;
    } else {
      timeScore = Math.max(0, 40 - (hoursUntilDue / 168) * 40);
    }

    // Factor 2: Priority level (0-30 points)
    const priorityScores = {
      low: 5,
      medium: 15,
      high: 25,
      urgent: 30,
    };
    const priorityScore = priorityScores[taskData.priority] || 15;

    // Factor 3: Effort required (0-20 points)
    let effortScore = 0;
    if (taskData.estimatedHours <= 1) {
      effortScore = 5;
    } else if (taskData.estimatedHours <= 3) {
      effortScore = 10;
    } else if (taskData.estimatedHours <= 6) {
      effortScore = 15;
    } else {
      effortScore = 20;
    }

    // Factor 4: Workload balance (0-10 points)
    const workloadScore = 5;

    const totalScore = timeScore + priorityScore + effortScore + workloadScore;
    return Math.min(100, Math.round(totalScore));
  }

  // Generate optimal study schedule
  generateOptimalSchedule(tasks) {
    const now = new Date();
    const schedule = [];
    let currentDate = new Date(now);

    const sortedTasks = [...tasks].sort((a, b) => {
      const scoreA = this.calculatePriorityScore({
        dueDate: a.dueDate,
        priority: a.priority,
        estimatedHours: a.estimatedHours,
      });
      const scoreB = this.calculatePriorityScore({
        dueDate: b.dueDate,
        priority: b.priority,
        estimatedHours: b.estimatedHours,
      });
      return scoreB - scoreA;
    });

    sortedTasks.forEach((task) => {
      const hoursNeeded = task.estimatedHours || 2;
      const hoursPerDay = Math.min(4, hoursNeeded);
      let remainingHours = hoursNeeded;

      while (remainingHours > 0) {
        const hoursToSchedule = Math.min(hoursPerDay, remainingHours);
        
        schedule.push({
          taskId: task._id,
          title: task.title,
          scheduledDate: new Date(currentDate),
          estimatedHours: hoursToSchedule,
          priority: task.priority,
          reason: this.generateScheduleReason(task, hoursToSchedule),
        });

        remainingHours -= hoursToSchedule;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return schedule;
  }

  generateScheduleReason(task, hours) {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue <= 24) {
      return 'URGENT: Due within 24 hours';
    } else if (hoursUntilDue <= 48) {
      return 'High priority: Due soon';
    } else if (task.priority === 'urgent' || task.priority === 'high') {
      return `Important task requiring ${hours} hours of focused work`;
    } else if (hours >= 4) {
      return 'Large task - broken into manageable sessions';
    } else {
      return 'Recommended work session';
    }
  }

  // Generate productivity recommendations
  getProductivityRecommendations(tasks) {
    const recommendations = [];
    const now = new Date();

    const overdueTasks = tasks.filter(
      (task) => new Date(task.dueDate) < now && task.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'overdue',
        message: `You have ${overdueTasks.length} overdue task(s). Prioritize these immediately!`,
        priority: 'critical',
      });
    }

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = tasks.filter(
      (task) => new Date(task.dueDate) <= todayEnd && task.status !== 'completed'
    );
    if (dueToday.length > 0) {
      recommendations.push({
        type: 'due-today',
        message: `${dueToday.length} task(s) due today. Stay focused!`,
        priority: 'warning',
      });
    }

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const dueThisWeek = tasks.filter(
      (task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate > todayEnd && dueDate <= weekEnd && task.status !== 'completed';
      }
    );
    if (dueThisWeek.length > 3) {
      recommendations.push({
        type: 'heavy-week',
        message: `You have ${dueThisWeek.length} tasks due this week. Plan your time wisely!`,
        priority: 'warning',
      });
    }

    const largeTasks = tasks.filter(
      (task) => task.estimatedHours >= 6 && task.status !== 'completed'
    );
    if (largeTasks.length > 0) {
      recommendations.push({
        type: 'break-down',
        message: 'Consider breaking down large tasks into smaller, manageable chunks.',
        priority: 'info',
      });
    }

    if (tasks.length > 10) {
      recommendations.push({
        type: 'workload',
        message: 'You have many pending tasks. Focus on completing a few before starting new ones.',
        priority: 'info',
      });
    }

    return recommendations;
  }

  // ========== Mock Data for Demo Mode ==========

  mockRiskPrediction(task) {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let riskScore = 0;
    const factors = [];

    if (hoursUntilDue < 24) {
      riskScore = 85;
      factors.push('Less than 24 hours until deadline');
    } else if (hoursUntilDue < 48) {
      riskScore = 65;
      factors.push('Deadline within 2 days');
    } else if (hoursUntilDue < 72) {
      riskScore = 45;
      factors.push('Deadline within 3 days');
    } else {
      riskScore = 25;
      factors.push('Sufficient time remaining');
    }

    if (task.estimatedHours > 10) {
      riskScore += 15;
      factors.push('Large task requiring significant time');
    }

    if (task.priority === 'urgent' || task.priority === 'high') {
      riskScore += 10;
      factors.push('High priority task');
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel = 'low';
    if (riskScore > 75) riskLevel = 'critical';
    else if (riskScore > 50) riskLevel = 'high';
    else if (riskScore > 25) riskLevel = 'medium';

    return {
      riskScore,
      riskLevel,
      factors,
      recommendation: riskScore > 50 
        ? 'Start working on this task immediately. Consider breaking it into smaller chunks.'
        : 'You have time, but don\'t procrastinate. Start planning your approach.',
    };
  }

  mockDailyPlan(tasks, availableHours) {
    const sorted = [...tasks].sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }).slice(0, 5);

    const schedule = [];
    let currentHour = 9; // Start at 9 AM

    sorted.forEach((task) => {
      const hours = Math.min(task.estimatedHours, 3);
      schedule.push({
        taskId: task._id || '',
        title: task.title || 'Untitled Task',
        scheduledDate: new Date(),
        estimatedHours: hours,
        priority: task.priority,
        timeSlot: `${currentHour}:00 - ${currentHour + hours}:00`,
        reason: this.generatePlanReason(task, hours),
      });
      currentHour += hours + 1; // 1 hour break
    });

    return schedule;
  }

  generatePlanReason(task, hours) {
    const now = new Date();
    const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    const title = task.title || 'this task';

    if (hoursUntilDue <= 24) {
      return `URGENT: "${title}" is due within 24 hours — complete now!`;
    } else if (hoursUntilDue <= 48) {
      return `"${title}" due soon — allocate ${hours}h to stay on track`;
    } else if (task.priority === 'urgent' || task.priority === 'high') {
      return `High-priority: "${title}" needs ${hours}h of focused work`;
    } else if (hours >= 3) {
      return `Deep work on "${title}" — ${hours}h block for meaningful progress`;
    } else {
      return `Quick session on "${title}" — ${hours}h to move forward`;
    }
  }

  mockTaskBreakdown(title, description, estimatedHours) {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const isCoding = /code|program|develop|build|implement|api|database|backend|frontend|app|website|script/.test(lowerTitle + lowerDesc);
    const isWriting = /write|essay|report|paper|article|blog|document|read/.test(lowerTitle + lowerDesc);
    const isStudying = /study|learn|review|exam|quiz|test|chapter|lecture|note/.test(lowerTitle + lowerDesc);
    const isDesign = /design|ui|ux|figma|prototype|wireframe|mockup/.test(lowerTitle + lowerDesc);
    const isResearch = /research|investigate|analyze|survey|literature|data/.test(lowerTitle + lowerDesc);

    const subtasks = [];
    let order = 1;

    if (isCoding) {
      subtasks.push(
        { title: 'Requirements & Setup', description: 'Define scope, set up repo/environment', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Core Logic Implementation', description: 'Write the main algorithms and business logic', estimatedHours: Math.round(estimatedHours * 0.4), order: order++ },
        { title: 'Integration & API', description: 'Connect components, build endpoints', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Testing & Debugging', description: 'Write tests, fix bugs, verify edge cases', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Code Review & Deploy', description: 'Final review, documentation, deployment', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else if (isWriting) {
      subtasks.push(
        { title: 'Outline & Research', description: 'Create structure, gather sources', estimatedHours: Math.round(estimatedHours * 0.25), order: order++ },
        { title: 'First Draft', description: 'Write the main content without editing', estimatedHours: Math.round(estimatedHours * 0.4), order: order++ },
        { title: 'Revision & Editing', description: 'Improve clarity, flow, and arguments', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Proofreading', description: 'Check grammar, citations, formatting', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Final Polish', description: 'Final review and submission prep', estimatedHours: Math.round(estimatedHours * 0.05), order: order++ }
      );
    } else if (isStudying) {
      subtasks.push(
        { title: 'Gather Materials', description: 'Collect notes, textbooks, resources', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Active Review Sessions', description: 'Spaced repetition, practice problems', estimatedHours: Math.round(estimatedHours * 0.5), order: order++ },
        { title: 'Mock Tests/Quizzes', description: 'Simulate exam conditions, identify gaps', estimatedHours: Math.round(estimatedHours * 0.2), order: order++ },
        { title: 'Weak Area Focus', description: 'Deep dive into problem topics', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Final Review', description: 'Quick recap of key concepts', estimatedHours: Math.round(estimatedHours * 0.05), order: order++ }
      );
    } else if (isDesign) {
      subtasks.push(
        { title: 'Requirements & Inspiration', description: 'Understand brief, collect references', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Wireframes & Concepts', description: 'Low-fidelity layouts and explorations', estimatedHours: Math.round(estimatedHours * 0.25), order: order++ },
        { title: 'High-Fidelity Design', description: 'Detailed mockups, design system', estimatedHours: Math.round(estimatedHours * 0.35), order: order++ },
        { title: 'Prototype & Feedback', description: 'Interactive prototype, stakeholder review', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Handoff Assets', description: 'Export specs, components, documentation', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else if (isResearch) {
      subtasks.push(
        { title: 'Define Research Questions', description: 'Clarify scope and objectives', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ },
        { title: 'Literature Search', description: 'Find and collect relevant sources', estimatedHours: Math.round(estimatedHours * 0.3), order: order++ },
        { title: 'Analysis & Synthesis', description: 'Extract insights, compare findings', estimatedHours: Math.round(estimatedHours * 0.35), order: order++ },
        { title: 'Draft Report', description: 'Structure findings and arguments', estimatedHours: Math.round(estimatedHours * 0.15), order: order++ },
        { title: 'Finalize & Cite', description: 'Polish, format references, submit', estimatedHours: Math.round(estimatedHours * 0.1), order: order++ }
      );
    } else {
      // Generic fallback — but still varied based on hours
      const steps = estimatedHours > 6 ? 5 : estimatedHours > 3 ? 4 : 3;
      const baseHours = Math.floor(estimatedHours / steps);
      const remainder = estimatedHours % steps;
      const genericSteps = [
        { title: 'Planning & Preparation', description: 'Break down the task and gather resources' },
        { title: 'Execution Phase 1', description: 'Complete the first major portion' },
        { title: 'Execution Phase 2', description: 'Continue and complete the work' },
        { title: 'Review & Refine', description: 'Check quality and make improvements' },
        { title: 'Finalize & Deliver', description: 'Wrap up and submit/complete' }
      ];
      for (let i = 0; i < steps; i++) {
        subtasks.push({
          title: genericSteps[i].title,
          description: genericSteps[i].description,
          estimatedHours: baseHours + (i < remainder ? 1 : 0),
          order: order++
        });
      }
    }

    return {
      subtasks,
      totalEstimatedHours: estimatedHours,
      suggestedOrder: 'sequential',
    };
  }

  mockNextAction(tasks) {
    const now = new Date();
    const urgent = tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    if (!urgent) {
      return {
        taskId: '',
        title: 'No pending tasks',
        reason: 'All caught up! Great job!',
        urgency: 'low',
        estimatedImpact: 'N/A',
      };
    }

    const hoursUntilDue = (new Date(urgent.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      taskId: urgent._id || '',
      title: urgent.title || 'Untitled Task',
      reason: hoursUntilDue < 24 
        ? 'Due in less than 24 hours - this is your top priority!'
        : `Due in ${Math.round(hoursUntilDue / 24)} days - start now to avoid last-minute stress`,
      urgency: hoursUntilDue < 24 ? 'critical' : hoursUntilDue < 48 ? 'high' : 'medium',
      estimatedImpact: `Completing this will reduce your stress and free up time for other tasks`,
    };
  }

  mockBurnoutDetection(tasks, deadlines) {
    const weekDeadlines = deadlines.filter(d => {
      const daysUntil = (new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 7;
    });

    const workloadScore = Math.min(100, (tasks.length * 5) + (weekDeadlines.length * 10));
    let riskLevel = 'low';
    
    if (workloadScore > 80) riskLevel = 'critical';
    else if (workloadScore > 60) riskLevel = 'high';
    else if (workloadScore > 40) riskLevel = 'medium';

    const recommendations = [];
    if (weekDeadlines.length > 5) {
      recommendations.push('You have too many deadlines this week. Prioritize ruthlessly.');
    }
    if (tasks.length > 10) {
      recommendations.push('Focus on completing existing tasks before taking on new ones.');
    }
    recommendations.push('Take regular breaks - use the Pomodoro technique (25 min work, 5 min break)');
    recommendations.push('Get at least 7-8 hours of sleep - it improves productivity');

    return {
      riskLevel,
      workloadScore,
      deadlinePressure: weekDeadlines.length,
      recommendations,
      suggestedBreak: 'Take a 30-minute break tonight. Go for a walk, meditate, or do something you enjoy.',
    };
  }

  mockDeadlineSimulation(task, newDate, allTasks) {
    const originalDays = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const newDays = (newDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const delay = newDays - originalDays;

    const originalRisk = Math.min(100, Math.max(0, 50 - originalDays * 5));
    const newRisk = Math.min(100, Math.max(0, 50 - newDays * 5));

    const impactOnOtherTasks = [];
    if (delay > 2) {
      impactOnOtherTasks.push('Other deadlines may become higher priority');
      impactOnOtherTasks.push(`Workload increases by ${Math.round(delay * 10)}%`);
    }

    return {
      originalRisk,
      newRisk,
      impactOnOtherTasks,
      workloadChange: Math.round(delay * 10),
      recommendation: delay > 3 
        ? 'Warning: Significant delay may create a bottleneck. Only postpone if absolutely necessary.'
        : 'Small delay is manageable. Use the extra time wisely.',
    };
  }

  mockWeeklyReport(stats) {
    const completed = stats.completedTasks || 0;
    const missed = stats.missedTasks || 0;
    const streak = stats.streak || 0;
    const total = completed + missed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const productivityChange = Math.round((completed - missed) * 2.5); // rough heuristic

    let insights = '';
    let nextWeekFocus = '';
    const achievements = [];

    // Dynamic achievements
    if (streak >= 7) achievements.push(`🔥 Amazing ${streak}-day streak!`);
    else if (streak >= 3) achievements.push(`🔥 ${streak}-day streak maintained`);
    if (completed >= 10) achievements.push(`✅ Completed ${completed} tasks this week`);
    else if (completed >= 5) achievements.push(`✅ Completed ${completed} tasks this week`);
    else if (completed > 0) achievements.push(`✅ Finished ${completed} task${completed === 1 ? '' : 's'}`);
    if (missed === 0 && completed > 0) achievements.push('🎯 Zero missed deadlines!');
    if (completionRate >= 90) achievements.push(`📈 ${completionRate}% completion rate`);
    if (streak > (stats.prevStreak || 0)) achievements.push('📈 Streak increased!');

    // Dynamic insights
    if (completed === 0) {
      insights = 'No tasks completed this week. Consider setting smaller, achievable goals to build momentum.';
      nextWeekFocus = 'Start with just 1-2 small tasks daily. Consistency beats intensity.';
    } else if (missed > completed) {
      insights = `You completed ${completed} but missed ${missed} tasks. Overcommitment may be the issue.`;
      nextWeekFocus = 'Prioritize ruthlessly — do fewer things, but finish them. Use the Risk Predictor.';
    } else if (missed > 0) {
      insights = `Good progress with ${completed} done, but ${missed} slipped. Identify what blocked them.`;
      nextWeekFocus = 'Review missed tasks — reschedule or delegate. Aim for zero misses next week.';
    } else if (completionRate >= 90 && completed >= 5) {
      insights = `Excellent week! ${completed} completed, zero missed. Your planning is working.`;
      nextWeekFocus = 'Maintain this rhythm. Try Focus Mode for deep work on complex tasks.';
    } else {
      insights = `Solid week: ${completed} tasks done${missed > 0 ? `, ${missed} missed` : ''}. Consistency is building.`;
      nextWeekFocus = `Aim for ${Math.max(completed + 2, 5)}+ tasks next week. Keep the streak alive!`;
    }

    return {
      completedTasks: completed,
      missedTasks: missed,
      streak,
      productivityChange: Math.max(-50, Math.min(50, productivityChange)),
      achievements,
      insights,
      nextWeekFocus,
    };
  }

  mockEmergencyMode(tasks, deadlines) {
    const sorted = [...tasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const prioritizedTasks = sorted.map((task, index) => ({
      taskId: task._id || '',
      title: task.title || `Task ${index + 1}`,
      priority: index + 1,
      timeAllocation: `${Math.max(1, Math.round(task.estimatedHours))} hours`,
      reason: index === 0 ? 'Most urgent - due soonest' : `Priority #${index + 1}`,
    }));

    // Build contextual study plan
    const studyPlan = [];
    const urgentCount = tasks.filter(t => {
      const h = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
      return h <= 48 && t.status !== 'completed';
    }).length;
    const totalHours = tasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    studyPlan.push('1. 🚫 Eliminate distractions — phone on Do Not Disturb, close extra tabs');
    studyPlan.push('2. ⏱️ Use Pomodoro: 25 min focus, 5 min break — repeat 4x then 30 min break');

    if (urgentCount > 0) {
      studyPlan.push(`3. 🔴 ${urgentCount} task${urgentCount === 1 ? ' is' : 's are'} due within 48h — do these FIRST, nothing else`);
    } else {
      studyPlan.push('3. 🎯 Pick the single most important task and finish it before moving on');
    }

    if (totalHours > 20) {
      studyPlan.push('4. ⚡ Workload is high — skip perfection, aim for "good enough" on each task');
    } else {
      studyPlan.push('4. 📝 Break each task into 1-2 hour chunks — crossing off builds momentum');
    }

    studyPlan.push('5. 💧 Basics: hydrate, eat protein, 20-min walk, sleep 7h — you cannot skip these');

    return {
      prioritizedTasks,
      studyPlan,
      criticalWarning: '🚨 EMERGENCY MODE ACTIVATED: Focus on survival, not perfection. Complete what you can, then reassess.',
    };
  }

  mockChatResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const pending = context?.pendingTasks || 0;
    const upcoming = context?.upcomingDeadlines || 0;
    const streak = context?.userStreak || 0;
const level = context?.userLevel || 1;

// Data-query patterns: deterministic, zero Gemini calls.
// These are checked before the existing conversational patterns.
const taskCountPattern = /^how many (?:pending )?tasks? do i have(?:\?|$)/i;
const deadlineCountPattern = /^how many deadlines? do i have this week(?:\?|$)/i;
const listDeadlinesPattern = /^what deadlines? do i have(?:\?|$)/i;
const listTasksPattern = /^what tasks? do i have(?:\?|$)/i;
const capabilitiesPattern = /^what can you help me with(?:\?|$)/i;
const greetingPattern = /^(hello|hi|hey)(?:\?|!|$)/i;
const thanksPattern = /^(thanks|thank you)(?:\?|!|$)/i;

if (taskCountPattern.test(lowerMessage)) {
  return `You have ${pending} pending task${pending === 1 ? '' : 's'}.`;
}
if (deadlineCountPattern.test(lowerMessage)) {
  return `You have ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'} this week.`;
}
if (listDeadlinesPattern.test(lowerMessage)) {
  const titles = context.deadlines?.map((d) => d.title).filter(Boolean) || [];
  if (titles.length === 0) return 'You have no upcoming deadlines.';
  return `You have the following upcoming deadlines: ${titles.join(', ')}.`;
}
if (listTasksPattern.test(lowerMessage)) {
  const titles = context.tasks?.map((t) => t.title).filter(Boolean) || [];
  if (titles.length === 0) return 'You have no pending tasks.';
  return `You have the following pending tasks: ${titles.join(', ')}.`;
}
if (capabilitiesPattern.test(lowerMessage)) {
  return `I can help you with planning your day using the Daily Planner, breaking down tasks with the Task Breakdown, checking deadline risks with the Risk Predictor, detecting burnout, simulating deadline changes, generating weekly reports, and activating emergency mode. Ask me about any of these!`;
}
if (greetingPattern.test(lowerMessage)) {
  if (pending === 0 && upcoming === 0) {
    return `Hey! 👋 You're all caught up — no pending tasks or upcoming deadlines. Enjoy the calm! Want help planning ahead or setting up a new project?`;
  }
  return `Hey! You have ${pending} pending task${pending === 1 ? '' : 's'} and ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'} this week. How can I help you?`;
}
if (thanksPattern.test(lowerMessage)) {
  return `You're welcome! Ask me about your tasks, deadlines, or productivity tips.`;
}

// Existing conversational patterns follow below.
    if (pending === 0 && upcoming === 0) {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hey! 👋 You're all caught up — no pending tasks or upcoming deadlines. Enjoy the calm! Want help planning ahead or setting up a new project?`;
      }
      return `You're currently task-free! 🎉 No pending work, no looming deadlines. Perfect time to plan a new project or just relax. What would you like to do?`;
    }

    // Schedule/planning — now context-aware
    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan') || lowerMessage.includes('today')) {
      if (pending > 0) {
        return `You have ${pending} pending task${pending === 1 ? '' : 's'} and ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'}. The Smart Daily Planner can create a time-blocked schedule for your available hours. Want me to generate one?`;
      }
      return 'No pending tasks to schedule! You\'re free to plan something new or take a break.';
    }

    // Stress/burnout — context-aware
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('burnout') || lowerMessage.includes('anxious')) {
      if (upcoming > 5) {
        return `I see ${upcoming} deadlines this week and ${pending} active tasks — that IS a lot. Try: 1) Burnout Detector to quantify risk, 2) Emergency Mode if things are critical, 3) Even 10 min breaks help. Your streak of ${streak} days shows you can handle pressure!`;
      }
      if (pending > 8) {
        return `With ${pending} tasks in progress, it's easy to feel scattered. Consider: 1) Emergency Mode to ruthlessly prioritize, 2) Break down the largest task, 3) Your Level ${level} streak of ${streak} days proves consistency works.`;
      }
      return 'Feeling overwhelmed is normal. Quick wins: 1) Write down everything, 2) Pick ONE thing to finish now, 3) Use Pomodoro (25/5). You\'ve maintained a ' + streak + '-day streak — you\'re more capable than you know!';
    }

    // Break down tasks
    if (lowerMessage.includes('break') || lowerMessage.includes('split') || lowerMessage.includes('divide') || lowerMessage.includes('subtask')) {
      if (pending > 0) {
        return `You have ${pending} task${pending === 1 ? '' : 's'} that could be broken down. The AI Task Breakdown works best on tasks 3+ hours — it creates tailored subtasks (e.g., coding tasks get "Setup → Core Logic → Testing", writing gets "Outline → Draft → Edit"). Which task should I break down?`;
      }
      return 'No tasks to break down right now! Create a task first, then I can help split it into manageable pieces.';
    }

    // Next action / what to do
    if (lowerMessage.includes('what should i do') || lowerMessage.includes('where to start') || lowerMessage.includes('next') || lowerMessage.includes('priority')) {
      if (pending > 0) {
        return `Click "What Should I Do Next?" on your Dashboard — I'll analyze your ${pending} pending task${pending === 1 ? '' : 's'} (${upcoming} deadline${upcoming === 1 ? '' : 's'} this week) and recommend the single most impactful task based on urgency, priority, and your current workload.`;
      }
      return 'Nothing pending! You\'re free to start something new or enjoy the break.';
    }

    // Risk/deadline
    if (lowerMessage.includes('risk') || lowerMessage.includes('miss') || lowerMessage.includes('deadline') || lowerMessage.includes('late')) {
      if (upcoming > 0) {
        return `You have ${upcoming} upcoming deadline${upcoming === 1 ? '' : 's'} and ${pending} active tasks. Each task shows a risk score (Green=safe, Yellow=caution, Red=critical). The Risk Predictor analyzes due date, priority, and effort. Want me to check a specific task?`;
      }
      return 'No upcoming deadlines to worry about! 🎉 All clear on the risk front.';
    }

    // Weekly report
    if (lowerMessage.includes('week') || lowerMessage.includes('report') || lowerMessage.includes('progress') || lowerMessage.includes('how am i')) {
      return `Your weekly report shows: streak ${streak}, level ${level}, ${pending} active tasks, ${upcoming} deadlines this week. The full Weekly Report gives completion rate, achievements, and next week's focus. Want me to generate it?`;
    }

    // Motivational / general
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourag') || lowerMessage.includes('good job') || lowerMessage.includes('proud')) {
      if (streak >= 7) return `🔥 ${streak}-day streak! That's serious consistency. Level ${level} and climbing. Keep protecting that streak — it's your superpower.`;
      if (streak >= 3) return `Nice! ${streak} days in a row at Level ${level}. Momentum is real — one day at a time.`;
      return `Every expert started as a beginner. Your Level ${level} journey with a ${streak}-day streak is building something real. What's the next small win?`;
    }

    // Default — context-aware
    return `I'm your DeadlineHero AI! Right now you have ${pending} pending task${pending === 1 ? '' : 's'} and ${upcoming} deadline${upcoming === 1 ? '' : 's'} this week (streak: ${streak}, level: ${level}). Ask me about: planning your day, breaking down a task, checking risks, managing overwhelm, or your weekly progress. What helps most right now?`;
  }
}
const aiService = new AIService();

module.exports = { aiService, buildUpcomingDeadlineContext };
