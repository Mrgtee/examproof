import { CONTRACT_CONFIG } from "./contract-config";

type RegisterExamInput = {
  examId: string;
  metadataHash: string;
  startTime: string;
  endTime: string;
};

type CommitSubmissionInput = {
  examId: string;
  candidateId: string;
  submissionHash: string;
};

type FinalizeScoreInput = {
  examId: string;
  candidateId: string;
  objectiveScore: number;
  subjectiveScore: number;
  totalScore: number;
};

export async function registerExamOnGenLayer(input: RegisterExamInput) {
  console.log("Register exam on Studionet contract", {
    contractAddress: CONTRACT_CONFIG.contractAddress,
    input,
  });

  return {
    success: true,
    txHash: "studionet-register-placeholder",
  };
}

export async function commitSubmissionOnGenLayer(input: CommitSubmissionInput) {
  console.log("Commit submission on Studionet contract", {
    contractAddress: CONTRACT_CONFIG.contractAddress,
    input,
  });

  return {
    success: true,
    txHash: "studionet-commit-placeholder",
  };
}

export async function finalizeScoreOnGenLayer(input: FinalizeScoreInput) {
  console.log("Finalize score on Studionet contract", {
    contractAddress: CONTRACT_CONFIG.contractAddress,
    input,
  });

  return {
    success: true,
    txHash: "studionet-finalize-placeholder",
  };
}