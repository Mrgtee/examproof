export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function authField(value: string): string {
  const byteLength = new TextEncoder().encode(value).length;
  return `${byteLength}:${value}`;
}

export function submissionAuthorizationPayload(params: {
  examId: string;
  candidateId: string;
  answersJson: string;
  submittedAt: string;
}): string {
  return [
    "ExamProofSubmission:v1",
    `exam_id:${authField(params.examId)}`,
    `candidate_id:${authField(params.candidateId)}`,
    `submitted_at:${authField(params.submittedAt)}`,
    `answers_json:${authField(params.answersJson)}`,
  ].join("\n");
}

export async function hashSubmissionAuthorization(params: {
  examId: string;
  candidateId: string;
  candidateToken: string;
  answersJson: string;
  submittedAt: string;
}): Promise<string> {
  const candidateSecretHash = await sha256(params.candidateToken);
  const payload = submissionAuthorizationPayload(params);
  return sha256(`${payload}\nsecret_hash:${authField(candidateSecretHash)}`);
}
