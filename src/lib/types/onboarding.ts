// ─── User Profile (output of intake normalization) ───
export interface UserProfile {
  personal: {
    name: string;
    age: string;
    location: string;
    background: string;
  };
  career: {
    currentRole: string;
    industry: string;
    yearsExperience: string;
    skills: string[];
    careerGoals: string;
  };
  financial: {
    incomeRange: string;
    savingsStatus: string;
    debtStatus: string;
    financialGoals: string;
  };
  wellness: {
    exerciseFrequency: string;
    sleepQuality: string;
    stressLevel: string;
    healthGoals: string;
  };
  lifestyle: {
    relationships: string;
    hobbies: string;
    communityInvolvement: string;
    lifestyleGoals: string;
  };
  freeform: {
    voiceTranscript: string;
    additionalContext: string;
  };
  documents: UploadedDocument[];
}

export interface UploadedDocument {
  name: string;
  type: string;
  size: number;
  /** base64-encoded content */
  content: string;
}

// ─── Onboarding form state ───
export interface OnboardingFormData {
  // Step 1: About You
  name: string;
  age: string;
  location: string;
  background: string;

  // Step 2: Career & Finance
  currentRole: string;
  industry: string;
  yearsExperience: string;
  skills: string;
  incomeRange: string;
  financialGoals: string;

  // Step 3: Wellness & Lifestyle
  exerciseFrequency: string;
  sleepQuality: string;
  stressLevel: string;
  relationships: string;
  hobbies: string;

  // Step 4: Goals & Aspirations (voice + text)
  careerGoals: string;
  healthGoals: string;
  lifestyleGoals: string;
  voiceTranscript: string;

  // Step 5: Documents
  documents: UploadedDocument[];
}

export const INITIAL_FORM_DATA: OnboardingFormData = {
  name: "",
  age: "",
  location: "",
  background: "",
  currentRole: "",
  industry: "",
  yearsExperience: "",
  skills: "",
  incomeRange: "",
  financialGoals: "",
  exerciseFrequency: "",
  sleepQuality: "",
  stressLevel: "",
  relationships: "",
  hobbies: "",
  careerGoals: "",
  healthGoals: "",
  lifestyleGoals: "",
  voiceTranscript: "",
  documents: [],
};

// ─── Step definitions ───
export interface StepConfig {
  number: number;
  title: string;
  subtitle: string;
  icon: string;
}

export const ONBOARDING_STEPS: StepConfig[] = [
  {
    number: 1,
    title: "About You",
    subtitle: "The basics",
    icon: "user",
  },
  {
    number: 2,
    title: "Career & Finance",
    subtitle: "Where you stand",
    icon: "briefcase",
  },
  {
    number: 3,
    title: "Wellness & Lifestyle",
    subtitle: "How you live",
    icon: "heart",
  },
  {
    number: 4,
    title: "Goals & Voice",
    subtitle: "Where you're headed",
    icon: "mic",
  },
  {
    number: 5,
    title: "Documents",
    subtitle: "Optional uploads",
    icon: "upload",
  },
];
