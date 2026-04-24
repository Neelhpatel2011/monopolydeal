export type BoardRenderableCardRef = {
  id: string;
  backendCardId: string;
  catalogCardId: string;
};

export type BoardHandCardRef = BoardRenderableCardRef & {
  label: string;
  actionOptions?: {
    actionType: string;
    cardKind: string;
    canBank: boolean;
    requiredFields: string[];
    chosenDefaults: Record<string, string>;
    fieldOptions: Array<{
      field: string;
      options: Array<{ value: string; label: string; detail?: string | null }>;
      byTarget: Record<string, Array<{ value: string; label: string; detail?: string | null }>>;
    }>;
  };
};

export type BoardMoneyCardRef = BoardRenderableCardRef & {
  label: string;
  amount: string;
  tone: "paper" | "sand" | "sky" | "sage";
};

export type BoardPropertyCardRef = BoardRenderableCardRef & {
  kind: "property" | "wild";
};
