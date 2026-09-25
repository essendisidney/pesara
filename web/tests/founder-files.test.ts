import { describe, expect, it } from "vitest";
import { activitySummary } from "../src/lib/admin/present";
import { applicationDocumentPath, attachedDocument, documentDisplayName, safeFileName, unreadFor } from "../src/lib/documents";

const application = "11111111-1111-4111-8111-111111111111";
const token = "22222222-2222-4222-8222-222222222222";

describe("founder files", () => {
  it("keeps a document path inside the application and drops traversal", () => {
    expect(applicationDocumentPath(application, "../secret.pdf", token)).toBe(
      `${application}/${token}-secret.pdf`,
    );
    expect(safeFileName("..")).toBeNull();
    expect(applicationDocumentPath("not-an-id", "deck.pdf", token)).toBeNull();
    expect(applicationDocumentPath(application, "C:\\secret\\deck.pdf", token)).toBe(`${application}/${token}-deck.pdf`);
    expect(documentDisplayName(null, `${application}/${token}-deck.pdf`)).toBe("deck.pdf");
    expect(documentDisplayName("  Pitch  ", `${application}/${token}-deck.pdf`)).toBe("Pitch");
    expect(
      activitySummary("DOCUMENT_UPLOADED", { document_id: token, path: "secret/deck.pdf" }, new Map()),
    ).toBe("Document uploaded");
    expect(activitySummary("MESSAGE_SENT", { message_id: token, body: "private note" }, new Map())).toBe("Message sent");
    const names = new Map([[token, "Pitch"]]);
    expect(attachedDocument(token, names)).toEqual({ id: token, name: "Pitch" });
    expect(attachedDocument(application, names)).toBeNull();
    expect(attachedDocument(null, names)).toBeNull();
  });

  it("counts unread messages that this reader did not send", () => {
    expect(
      unreadFor(
        [
          { sender: "founder", readAt: null },
          { sender: "staff", readAt: null },
          { sender: "staff", readAt: "2026-09-23T00:00:00Z" },
        ],
        "founder",
      ),
    ).toBe(1);
  });
});
