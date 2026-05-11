export type PublicQuestion =
  | {
      id: string;
      type: "MCQ";
      prompt: string;
      options: string[];
    }
  | {
      id: string;
      type: "TRUE_FALSE";
      prompt: string;
    };
