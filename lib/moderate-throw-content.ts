import { GENRE_LABELS, type WorryGenre } from "@/lib/genres";

/**
 * モデルに必ず守らせる検閲方針（3基準を明示し、OK は例外的に限定的）。
 * 「迷ったら NG」「3つすべて満たすときだけ OK」。
 */
const SYSTEM = `あなたは「名言ボトル」アプリの唯一の投稿検閲者です。以下の3基準を**すべて満たすときだけ** decision を "OK" にします。1つでも疑わしければ "NG" です。

【必須：判定手順】
1. まず基準1をチェック → 違反なら NG
2. 次に基準2をチェック → 違反なら NG
3. 最後に基準3をチェック → 違反なら NG
4. 上記3つがすべて明確にクリアしたときのみ OK

【基準1：公序良俗・スパムの排除】
次は**必ず NG**：誹謗中傷、差別、脅迫、卑猥・性的な表現、宣伝・勧誘・URL・SNS誘導、意味のない反復（「あああ」「www」「ｗｗｗ」「ーーー」だけ等）、実在個人の名指し攻撃、暴力の肯定。

【基準2：日常すぎるつぶやきの排除】
次は**必ず NG**：日記や独り言レベルの身体・気分の一言だけ。
例：お腹すいた、腹減った、疲れた、つかれた、眠い、ねむい、だるい、暇、つまんない、学校行きたくない、仕事行きたくない、帰りたい、やばい（文脈なし）、今日は何もしない、今から寝る など。
※ これらが比喩や物語の一部として明確に名言化されている場合のみ例外可（稀）。

【基準3：短すぎる／中身のない言葉の排除】
次は**原則 NG**：誰にでも言えるだけの短い励まし・挨拶**のみ**で、情景・理由・洞察がほぼないもの。
例：頑張れ、がんばれ、ファイト、お疲れ、おつかれ、お疲れ様、大丈夫、元気出して、泣かないで、気にしない で完結している短文。
※ ただし、比喩・具体的情景・問いかけ・短い詩句として「他人の悩みに刺さる」なら OK（例：「小さな灯りでも、夜は照らせる」程度の完成度）。

【OK の例（イメージ）】
- 一般に引用・格言として他人に届けられる日本語で、具体性か余韻のどちらかがある。
- 15文字未満は**ほぼ NG**（極めて優れた格言のみ例外。迷ったら NG）。

【出力】
次の JSON のみ。説明・コードフェンス禁止。
{"decision":"OK" または "NG","reason":"NG のときのみ、ユーザー向けに短い日本語で最大60文字。OK のときは空文字。"}`;

export type ModerationOutcome =
  | { type: "allow" }
  | { type: "reject"; friendly: string; aiReason?: string }
  | { type: "service_error"; message: string };

const FRIENDLY_REJECT = "もう少しだけ、誰かの心に寄り添う言葉に整えてみませんか？";

function reject(aiReason: string): ModerationOutcome {
  return {
    type: "reject",
    friendly: FRIENDLY_REJECT,
    aiReason,
  };
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** 記号・空白を除いたコア（比較用） */
function coreAlpha(text: string): string {
  return normalizeText(text)
    .replace(/[\s　。、！？…〜~・･!?,.\-—_「」『』（）()\[\]{}'"'"']/g, "")
    .toLowerCase();
}

function hasRepeatedChars(text: string): boolean {
  const compact = coreAlpha(text);
  if (compact.length < 4) return false;
  return /^([ぁ-んァ-ヶーa-z0-9!！wWｗ])\1{3,}$/.test(compact);
}

function lacksVariety(text: string): boolean {
  const compact = coreAlpha(text);
  if (compact.length < 5) return false;
  const uniq = new Set(compact.split(""));
  return uniq.size <= 2;
}

/** 基準3：短い万能フレーズのみ */
function isGenericPlatitudeOnly(text: string): boolean {
  const raw = normalizeText(text);
  const c = coreAlpha(text);
  if (c.length === 0) return true;

  const exactOrShort = [
    "頑張れ",
    "がんばれ",
    "がんば",
    "頑張ろう",
    "がんばろう",
    "お疲れ",
    "おつかれ",
    "お疲れ様",
    "おつかれさま",
    "お疲れさま",
    "大丈夫",
    "大丈夫だよ",
    "大丈夫です",
    "ファイト",
    "元気出して",
    "元気だして",
    "泣かないで",
    "泣かないでね",
    "気にしないで",
    "いいんだよ",
    "そのままで",
    "応援してる",
    "応援してます",
    "愛してる",
    "ありがとう",
    "ごめんね",
    "ごめん",
    "すみません",
    "hello",
    "hi",
    "ok",
    "yes",
    "no",
  ];
  for (const w of exactOrShort) {
    if (c === w) return true;
    if (c.length <= w.length + 4 && (c.startsWith(w) || c.endsWith(w)) && raw.length <= 24) return true;
  }

  // 「頑張れ！」「お疲れ〜」など短い装飾のみ
  if (raw.length <= 14) {
    const stripped = c;
    if (/^(頑張|がんば|お疲|おつかれ|大丈夫|ファイト)/.test(stripped) && stripped.length <= 12) {
      return true;
    }
  }
  return false;
}

/** 基準2：日記・独り言 */
function isDiaryLevelMutter(text: string): boolean {
  const normalized = normalizeText(text);
  const n = normalized.toLowerCase();
  const patterns = [
    /^お腹すいた/,
    /^腹減った/,
    /^はらへった/,
    /^疲れた/,
    /^つかれた$/,
    /^眠い/,
    /^ねむい/,
    /^だるい$/,
    /^暇だ/,
    /^ひまだ/,
    /^つまんない/,
    /^つまらない/,
    /^学校[行い]きたくない/,
    /^仕事[行い]きたくない/,
    /^会社[行い]きたくない/,
    /^帰りたい$/,
    /^やばい$/,
    /^今から寝る/,
    /^ねる$/,
    /^寝る$/,
    /^おなかすいた/,
    /^お腹空いた/,
    /^何もしない/,
    /^なんもしない/,
    /^だるいな/,
    /^眠たい/,
  ];
  if (normalized.length <= 22 && patterns.some((re) => re.test(n))) return true;
  if (normalized.length <= 14 && /^(今日|いま|今)(は|も)?(ねむ|眠|疲|だる)/.test(normalized)) return true;
  return false;
}

/** 基準1：明らかなスパム・暴言・URL */
function hasSpamOrAbuse(text: string): boolean {
  const normalized = normalizeText(text).toLowerCase();
  const patterns = [
    /https?:\/\//,
    /www\./,
    /フォロー/,
    /\bfollow\b/,
    /dmして/,
    /line(を)?追加/,
    /副業/,
    /稼げる/,
    /無料配布/,
    /殺す/,
    /死ね/,
    /くたばれ/,
    /バカ\b/,
    /アホ\b/,
    /ちんこ|まんこ|セックス|えっち/,
  ];
  return patterns.some((re) => re.test(normalized));
}

/** AI が OK と言っても上書き拒否（基準の確実な反映） */
function shouldRejectDespiteAiOk(text: string): ModerationOutcome | null {
  const normalized = normalizeText(text);
  if (hasSpamOrAbuse(normalized)) {
    return reject("公序良俗やスパムに当たる可能性があるため、投稿できません。");
  }
  if (hasRepeatedChars(normalized) || lacksVariety(normalized)) {
    return reject("意味のある言葉として届きにくい文字列です。");
  }
  if (isDiaryLevelMutter(normalized)) {
    return reject("日記のひとことより、誰かに手渡せる言葉に近づけてみてください。");
  }
  if (isGenericPlatitudeOnly(normalized)) {
    return reject("短すぎる／誰にでも言える一言だけに見えます。情景や気持ちを少し添えてください。");
  }
  const core = coreAlpha(text);
  if (core.length > 0 && core.length < 8) {
    return reject("もう少しだけ、言葉を膨らませてみてください。");
  }
  return null;
}

function localRuleCheck(text: string): ModerationOutcome {
  const override = shouldRejectDespiteAiOk(text);
  if (override) return override;
  return { type: "allow" };
}

function parseJsonDecision(raw: string): { decision: "OK" | "NG"; reason: string } | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const j = JSON.parse(trimmed) as { decision?: unknown; reason?: unknown };
    const d = j.decision === "OK" || j.decision === "NG" ? j.decision : null;
    if (!d) return null;
    const reason = typeof j.reason === "string" ? j.reason.trim().slice(0, 120) : "";
    return { decision: d, reason };
  } catch {
    return null;
  }
}

/**
 * 投稿本文の自動検閲。
 * - まずローカルで基準1〜3の明らかな違反を拒否。
 * - OPENAI_API_KEY がある場合は AI で再判定（NG 優先のプロンプト）。
 * - AI が OK でも、ローカル事後チェックで弾く（基準の確実な反映）。
 */
export async function moderateThrowContent(text: string, genre: WorryGenre): Promise<ModerationOutcome> {
  const pre = localRuleCheck(text);
  if (pre.type !== "allow") {
    return pre;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn(
      "[moderateThrowContent] OPENAI_API_KEY 未設定。ローカルルールのみで判定（厳しめのパターンは上記で拒否済み）。",
    );
    return { type: "allow" };
  }

  const model = process.env.OPENAI_MODERATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const genreLabel = GENRE_LABELS[genre] ?? genre;
  const safeBody = text.replace(/\r\n/g, "\n").replace(/---END---/gi, "");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 22_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.05,
        max_tokens: 280,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `ジャンル: ${genreLabel}\n\n投稿本文（BEGIN〜END の間のみが本文）:\nBEGIN\n${safeBody}\nEND\n\n上記について、基準1→2→3の順で検査し JSON のみを返してください。`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        type: "service_error",
        message:
          "検閲サービスに一時的に接続できませんでした。時間をおいて再度お試しください。",
      };
    }

    const data: unknown = await res.json();
    const raw =
      typeof data === "object" &&
      data !== null &&
      "choices" in data &&
      Array.isArray((data as { choices: unknown }).choices)
        ? (data as { choices: { message?: { content?: string } }[] }).choices[0]?.message?.content
        : undefined;
    if (typeof raw !== "string") {
      return {
        type: "service_error",
        message: "内容の判定に失敗しました。少し表現を変えて、もう一度お試しください。",
      };
    }

    const parsed = parseJsonDecision(raw);
    if (!parsed) {
      return {
        type: "service_error",
        message: "内容の判定に失敗しました。少し表現を変えて、もう一度お試しください。",
      };
    }

    if (parsed.decision === "NG") {
      return reject(parsed.reason || "もう少しだけ表現を整えてみてください。");
    }

    const postCheck = shouldRejectDespiteAiOk(text);
    if (postCheck) {
      return postCheck;
    }

    return { type: "allow" };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      return {
        type: "service_error",
        message: "検閲がタイムアウトしました。短くするか、時間をおいて再度お試しください。",
      };
    }
    console.error(e);
    return {
      type: "service_error",
      message:
        "検閲サービスに一時的に接続できませんでした。時間をおいて再度お試しください。",
    };
  } finally {
    clearTimeout(t);
  }
}
