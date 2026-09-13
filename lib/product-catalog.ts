export type ProductId = "moveis" | "obra-civil" | "hidraulica" | "eletrica" | "revestimentos";

export type ProductDefinition = {
  id: ProductId;
  name: string;
  shortName: string;
  description: string;
  audience: string;
  href: string;
  status: "available" | "coming-soon";
};

export const productCatalog: ProductDefinition[] = [
  {
    id: "moveis",
    name: "OrçaMóvel",
    shortName: "Móveis",
    description: "Orçamentos profissionais para marcenaria sob medida, com clientes, projetos e PDFs personalizados.",
    audience: "Marceneiros e marcenarias",
    href: "/apps/moveis",
    status: "available",
  },
  {
    id: "obra-civil",
    name: "OrçaObra",
    shortName: "Obra civil",
    description: "Orçamentos organizados por serviços, materiais, etapas e metragem.",
    audience: "Pedreiros, mestres de obra e construtores",
    href: "/apps/obra-civil",
    status: "coming-soon",
  },
  {
    id: "hidraulica",
    name: "OrçaHidro",
    shortName: "Hidráulica",
    description: "Orçamentos para tubulações, conexões, pontos e serviços hidráulicos.",
    audience: "Encanadores e profissionais hidráulicos",
    href: "/apps/hidraulica",
    status: "coming-soon",
  },
  {
    id: "eletrica",
    name: "OrçaElétrica",
    shortName: "Elétrica",
    description: "Orçamentos por pontos, circuitos, cabos, quadros e serviços elétricos.",
    audience: "Eletricistas e instaladores",
    href: "/apps/eletrica",
    status: "coming-soon",
  },
  {
    id: "revestimentos",
    name: "OrçaRevest",
    shortName: "Revestimentos",
    description: "Orçamentos por área, piso, azulejo, revestimento e assentamento.",
    audience: "Azulejistas e assentadores",
    href: "/apps/revestimentos",
    status: "coming-soon",
  },
];
