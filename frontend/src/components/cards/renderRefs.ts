export type BoardRenderableCardRef = {
  id: string;
  catalogCardId: string;
};

export type BoardHandCardRef = BoardRenderableCardRef & {
  label: string;
};

export type BoardMoneyCardRef = BoardRenderableCardRef & {
  label: string;
  amount: string;
  tone: "paper" | "sand" | "sky" | "sage";
};

export type BoardPropertyCardRef = BoardRenderableCardRef & {
  kind: "property" | "wild";
};
