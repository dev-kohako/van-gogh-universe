import { render, screen } from "@testing-library/react";
import VanGoghDetails from "../VanGoghDetails";
import React from "react";

jest.mock("../../../../../public/data/vanGoghInfos", () => ({
  vanGoghInfo: {
    birthDate: "30 de março de 1853",
    deathDate: "29 de julho de 1890",
    profession: "Pintor pós-impressionista",
    notableWorks: ["Noite Estrelada", "Os Comedores de Batata", "Girassóis"],
  },
}));

describe("VanGoghDetails", () => {
  it("renders the section title correctly", () => {
    render(<VanGoghDetails />);
    const title = screen.getByRole("heading", { name: /vincent willem van gogh/i });
    expect(title).toBeInTheDocument();
  });

  it("renders all biographical information entries", () => {
    render(<VanGoghDetails />);

    const infoSection = screen.getByLabelText(/informações biográficas de van gogh/i);
    expect(infoSection).toBeInTheDocument();

    expect(screen.getByText(/Birth Date:/i)).toBeInTheDocument();
    expect(screen.getByText(/Death Date:/i)).toBeInTheDocument();
    expect(screen.getByText(/Profession:/i)).toBeInTheDocument();
    expect(screen.getByText(/Notable Works:/i)).toBeInTheDocument();

    expect(screen.getByText(/30 de março de 1853/i)).toBeInTheDocument();
    expect(screen.getByText(/29 de julho de 1890/i)).toBeInTheDocument();
    expect(screen.getByText(/Pintor pós-impressionista/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Noite Estrelada, Os Comedores de Batata, Girassóis/i)
    ).toBeInTheDocument();
  });

  it("formats labels correctly using formatLabel()", () => {
    const { formatLabel } = jest.requireActual("../VanGoghDetails");

    expect(formatLabel("birthDate")).toBe("Birth Date");
    expect(formatLabel("death_date")).toBe("Death date");
    expect(formatLabel("profession")).toBe("Profession");
    expect(formatLabel("notableWorks")).toBe("Notable Works");
  });
});
