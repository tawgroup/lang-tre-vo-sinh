import type { GameSnapshot } from "../gameState";

export type DialogueScript = {
  speaker: string;
  lines: string[];
};

export function masterDialogue(snapshot: GameSnapshot): DialogueScript {
  if (snapshot.phase === "intro") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Muốn học võ làng Tre thì trước hết phải biết giữ lễ, giữ nhịp và biết nhìn địa hình.",
        "Con hái 5 bông sen ven ao làm lễ nhập môn, rồi luyện 4 bù nhìn rơm quanh sân.",
        "Ao sen là nước thật: mép ao thì lội chậm, nước sâu thì chưa học bơi không xuống được.",
        "Space không chỉ để đánh. Đứng gần người, cổng hoặc lối đi thì Space sẽ nói chuyện hoặc tương tác.",
      ],
    };
  }

  if (snapshot.phase === "bamboo-ready") {
    return {
      speaker: "Thầy Ba",
      lines: [
        "Tốt. Bài sân làng đã xong.",
        "Đi xuống lối đất phía nam để sang bãi tre. Ở đó con luyện gậy và nhặt 3 thẻ tre.",
      ],
    };
  }

  if (snapshot.phase === "gate-open") {
    return {
      speaker: "Thầy Ba",
      lines: ["Đủ bài rồi. Ra cổng đình, Space hoặc E để vào hội làng."],
    };
  }

  return {
    speaker: "Thầy Ba",
    lines: [
      "Bài này không cần vội. Quan sát đường đất, bụi tre và khoảng cách trước khi vung gậy.",
      `Tiến độ: sen ${snapshot.lotuses}/${snapshot.requiredLotuses}, bù nhìn ${snapshot.dummies}/${snapshot.requiredDummies}, thẻ tre ${snapshot.bambooTokens}/${snapshot.requiredBambooTokens}.`,
    ],
  };
}
