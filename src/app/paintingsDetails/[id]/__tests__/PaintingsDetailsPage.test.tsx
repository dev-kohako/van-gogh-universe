import { render, screen } from "@testing-library/react";
import PaintingsDetailsPage, {
  generateMetadata,
  generateStaticParams,
} from "../page";

const mockView = jest.fn();
jest.mock("../PaintingDetailsView", () => ({
  PaintingDetailsView: (props: any) => {
    mockView(props);
    return <div data-testid="details-view">{props.painting?.namePainting}</div>;
  },
}));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PaintingsDetailsPage (server)", () => {
  beforeEach(() => mockView.mockClear());

  it("pre-renders a page for every painting", () => {
    const ids = generateStaticParams().map((entry) => entry.id);
    expect(ids).toHaveLength(100);
    expect(ids).toContain("1");
  });

  it("passes the painting, its neighbours and its position to the view", async () => {
    render(await PaintingsDetailsPage(params("2")));

    const props = mockView.mock.calls[0][0];
    expect(props.painting.id).toBe("2");
    expect(props.painting.imagePainting).toMatch(/^\/assets\/paintings\//);
    expect(props.prevPainting).toMatchObject({ id: "1" });
    expect(props.nextPainting).toMatchObject({ id: "3" });
    expect(props.position).toBe(2);
    expect(props.total).toBe(100);
    expect(screen.getByTestId("details-view")).toHaveTextContent(
      props.painting.namePainting,
    );
  });

  it("renders the empty state data when the painting does not exist", async () => {
    render(await PaintingsDetailsPage(params("nope")));

    expect(mockView.mock.calls[0][0].painting).toBeUndefined();
  });

  it("uses the painting name as the page title", async () => {
    const metadata = await generateMetadata(params("2"));
    expect(metadata.title).toMatch(/· Van Gogh Universe$/);
  });
});
